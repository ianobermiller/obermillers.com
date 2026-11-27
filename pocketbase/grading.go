package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

const gradingParentEmail = "ian@obermillers.com"

type gradingAssessment struct {
	Kind     string             `json:"kind"`
	Scores   map[string]float64 `json:"scores,omitempty"`
	Earned   *float64           `json:"earned,omitempty"`
	Possible *float64           `json:"possible,omitempty"`
	Source   string             `json:"source,omitempty"`
}

type gradingSaveRequest struct {
	Lesson           string          `json:"lesson"`
	StudentEmail     string          `json:"studentEmail"`
	Category         string          `json:"category"`
	ExpectedRevision *int            `json:"expectedRevision"`
	Assessment       json.RawMessage `json:"assessment"`
	Finish           *bool           `json:"finish"`
}

func registerGrading(app core.App) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		e.Router.PUT("/api/grading/grade", saveGradingGrade).Bind(apis.RequireAuth("users"))
		e.Router.PATCH("/api/grading/lessons/{id}/settings", saveGradingSettings).Bind(apis.RequireAuth("users"))
		return e.Next()
	})
}

func requireGradingParent(e *core.RequestEvent) error {
	e.Response.Header().Set("Cache-Control", "no-store")
	if e.Auth == nil || !e.Auth.Verified() || e.Auth.Email() != gradingParentEmail {
		return e.ForbiddenError("Only Ian can edit Chemistry grades.", nil)
	}
	return nil
}

func gradingFields(lesson *core.Record, category string) (map[string]float64, error) {
	result := map[string]float64{}
	exam := lesson.GetInt("number") == 8 || lesson.GetInt("number") == 15 || lesson.GetInt("number") == 25 || lesson.GetInt("number") == 35
	switch category {
	case "homework":
		var questions []struct {
			ID string `json:"id"`
		}
		if err := lesson.UnmarshalJSONField("questions", &questions); err != nil {
			return nil, err
		}
		for _, q := range questions {
			if q.ID != "" {
				result[q.ID] = 3
			}
		}
	case "lab":
		if !lesson.GetBool("hasLab") {
			return nil, errors.New("This lesson has no lab.")
		}
		return gradingLabFields(lesson)
	case "quiz":
		if !exam {
			result["percent"] = 100
		}
	case "exam":
		if exam {
			result["percent"] = 100
		}
	default:
		return nil, errors.New("Unknown assignment category.")
	}
	if len(result) == 0 {
		return nil, errors.New("This lesson has no assignment of that type.")
	}
	return result, nil
}

func gradingLabFields(lesson *core.Record) (map[string]float64, error) {
	result := map[string]float64{}
	var rubric []struct {
		ID  string  `json:"id"`
		Max float64 `json:"max"`
	}
	if err := lesson.UnmarshalJSONField("rubric", &rubric); err != nil {
		return nil, err
	}
	for _, item := range rubric {
		if item.ID != "hypothesis" || !lesson.GetBool("observationOnly") {
			result[item.ID] = item.Max
		}
	}
	return result, nil
}

func decodeGradingAssessment(raw []byte) (gradingAssessment, error) {
	var assessment gradingAssessment
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&assessment); err != nil {
		return assessment, errors.New("Invalid score data.")
	}
	switch assessment.Kind {
	case "detailed":
		if assessment.Scores == nil || assessment.Earned != nil || assessment.Possible != nil || assessment.Source != "" {
			return assessment, errors.New("Enter question scores for this assignment.")
		}
	case "imported":
		if assessment.Scores != nil || assessment.Earned == nil || assessment.Possible == nil || assessment.Source == "" {
			return assessment, errors.New("The imported total is incomplete.")
		}
	default:
		return assessment, errors.New("Unknown assessment format.")
	}
	return assessment, nil
}

func (assessment gradingAssessment) value() map[string]any {
	if assessment.Kind == "detailed" {
		return map[string]any{"kind": assessment.Kind, "scores": assessment.Scores}
	}
	return map[string]any{"kind": assessment.Kind, "earned": *assessment.Earned, "possible": *assessment.Possible, "source": assessment.Source}
}

func validateGradingScores(assessment gradingAssessment, fields map[string]float64, category string) (bool, error) {
	for id, score := range assessment.Scores {
		max, found := fields[id]
		if !found {
			return false, fmt.Errorf("Unknown score field %q.", id)
		}
		if math.IsNaN(score) || math.IsInf(score, 0) || score < 0 || score > max || ((category == "homework" || category == "lab") && math.Trunc(score) != score) {
			return false, fmt.Errorf("Enter a valid score between 0 and %g for %s.", max, id)
		}
	}
	return len(assessment.Scores) == len(fields), nil
}

func saveGradingGrade(e *core.RequestEvent) error {
	if err := requireGradingParent(e); err != nil {
		return err
	}
	var body gradingSaveRequest
	if err := e.BindBody(&body); err != nil || body.Lesson == "" || body.ExpectedRevision == nil || *body.ExpectedRevision < 0 || body.Finish == nil || (body.StudentEmail != "wells@obermillers.com" && body.StudentEmail != "isla@obermillers.com") {
		return e.BadRequestError("The grading request is incomplete.", nil)
	}
	assessment, err := decodeGradingAssessment(body.Assessment)
	if err != nil {
		return e.BadRequestError(err.Error(), nil)
	}
	var saved *core.Record
	err = e.App.RunInTransaction(func(tx core.App) error {
		lesson, err := tx.FindRecordById("grading_lessons", body.Lesson)
		if err != nil {
			return e.NotFoundError("Lesson not found.", nil)
		}
		if body.Category == "lab" && !lesson.GetBool("labAssigned") {
			return e.BadRequestError("This lab is not assigned.", nil)
		}
		fields, err := gradingFields(lesson, body.Category)
		if err != nil {
			return e.BadRequestError(err.Error(), nil)
		}
		record, err := tx.FindFirstRecordByFilter("grading_grades", "lesson = {:lesson} && studentEmail = {:student} && category = {:category}", dbx.Params{"lesson": body.Lesson, "student": body.StudentEmail, "category": body.Category})
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		if record == nil {
			if *body.ExpectedRevision != 0 {
				return e.Error(http.StatusConflict, "This grade changed. Reload before editing again.", nil)
			}
			collection, err := tx.FindCollectionByNameOrId("grading_grades")
			if err != nil {
				return err
			}
			record = core.NewRecord(collection)
			record.Set("lesson", body.Lesson)
			record.Set("studentEmail", body.StudentEmail)
			record.Set("category", body.Category)
		} else if record.GetInt("revision") != *body.ExpectedRevision {
			return e.Error(http.StatusConflict, "This grade changed in another tab. Reload before editing again.", nil)
		}
		var original gradingAssessment
		if !record.IsNew() {
			if err := record.UnmarshalJSONField("assessment", &original); err != nil {
				return err
			}
			if original.Kind != assessment.Kind {
				return e.BadRequestError("An imported total cannot be replaced with invented question scores.", nil)
			}
		}
		complete := true
		if assessment.Kind == "imported" {
			if record.IsNew() {
				return e.BadRequestError("New imported totals must come from the gradebook import.", nil)
			}
			if original.Earned == nil || original.Possible == nil || assessment.Source != original.Source || *assessment.Possible != *original.Possible {
				return e.BadRequestError("Keep the imported source and possible points unchanged.", nil)
			}
			if math.IsNaN(*assessment.Earned) || math.IsInf(*assessment.Earned, 0) || *assessment.Possible <= 0 || *assessment.Earned < 0 || *assessment.Earned > *assessment.Possible || ((body.Category == "homework" || body.Category == "lab") && math.Trunc(*assessment.Earned) != *assessment.Earned) {
				return e.BadRequestError("Enter a valid imported total.", nil)
			}
		} else {
			complete, err = validateGradingScores(assessment, fields, body.Category)
			if err != nil {
				return e.BadRequestError(err.Error(), nil)
			}
		}
		if *body.Finish && !complete {
			return e.BadRequestError("Enter every applicable score before finishing grading.", nil)
		}
		status := "draft"
		if *body.Finish || record.GetString("status") == "published" && complete {
			status = "published"
		}
		record.Set("assessment", assessment.value())
		record.Set("status", status)
		record.Set("revision", *body.ExpectedRevision+1)
		if err := tx.Save(record); err != nil {
			return e.BadRequestError("Could not save this grade.", err)
		}
		saved = record
		return nil
	})
	if err != nil {
		return err
	}
	if err := apis.EnrichRecord(e, saved); err != nil {
		return e.InternalServerError("Could not load the saved grade.", nil)
	}
	return e.JSON(http.StatusOK, saved)
}

func saveGradingSettings(e *core.RequestEvent) error {
	if err := requireGradingParent(e); err != nil {
		return err
	}
	var body struct {
		LabAssigned     *bool `json:"labAssigned"`
		ObservationOnly *bool `json:"observationOnly"`
	}
	if err := e.BindBody(&body); err != nil || body.LabAssigned == nil || body.ObservationOnly == nil {
		return e.BadRequestError("The lab settings are incomplete.", nil)
	}
	var saved *core.Record
	err := e.App.RunInTransaction(func(tx core.App) error {
		lesson, err := tx.FindRecordById("grading_lessons", e.Request.PathValue("id"))
		if err != nil {
			return e.NotFoundError("Lesson not found.", nil)
		}
		if !lesson.GetBool("hasLab") {
			return e.BadRequestError("This lesson has no lab.", nil)
		}
		observationChanged := lesson.GetBool("observationOnly") != *body.ObservationOnly
		lesson.Set("labAssigned", *body.LabAssigned)
		lesson.Set("observationOnly", *body.ObservationOnly)
		if err := tx.Save(lesson); err != nil {
			return err
		}
		if observationChanged {
			fields, err := gradingLabFields(lesson)
			if err != nil {
				return err
			}
			grades, err := tx.FindRecordsByFilter("grading_grades", "lesson = {:lesson} && category = 'lab'", "", 0, 0, dbx.Params{"lesson": lesson.Id})
			if err != nil {
				return err
			}
			for _, grade := range grades {
				var assessment gradingAssessment
				if err := grade.UnmarshalJSONField("assessment", &assessment); err != nil {
					return err
				}
				if assessment.Kind != "detailed" {
					continue
				}
				// Dropping an inapplicable hypothesis is not a score edit. Restoring it
				// requires a real score before the report can be published again.
				if *body.ObservationOnly {
					delete(assessment.Scores, "hypothesis")
				}
				complete, err := validateGradingScores(assessment, fields, "lab")
				if err != nil {
					return err
				}
				grade.Set("assessment", assessment.value())
				if !complete {
					grade.Set("status", "draft")
				}
				grade.Set("revision", grade.GetInt("revision")+1)
				if err := tx.Save(grade); err != nil {
					return err
				}
			}
		}
		saved = lesson
		return nil
	})
	if err != nil {
		return err
	}
	if err := apis.EnrichRecord(e, saved); err != nil {
		return e.InternalServerError("Could not load the lab settings.", nil)
	}
	return e.JSON(http.StatusOK, saved)
}
