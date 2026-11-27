package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os/exec"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
	"github.com/pocketbase/pocketbase/tools/filesystem"
)

func newGradingTestApp(t *testing.T) *tests.TestApp {
	t.Helper()
	app, err := tests.NewTestApp(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(app.Cleanup)
	if _, err := app.FindCollectionByNameOrId("users"); err != nil {
		if err := app.Save(core.NewAuthCollection("users")); err != nil {
			t.Fatal(err)
		}
	}
	output, err := exec.Command("node", "--input-type=module", "-e", `import {gradingSchema} from '../src/grading/pocketbase.schema.mjs'; process.stdout.write(JSON.stringify(gradingSchema));`).Output()
	if err != nil {
		t.Fatal(err)
	}
	var specs []struct {
		Name    string
		Fields  []map[string]any
		Rules   map[string]any
		Indexes []struct {
			Columns []string
			Unique  bool
		}
	}
	if err := json.Unmarshal(output, &specs); err != nil {
		t.Fatal(err)
	}
	ids := map[string]string{}
	for _, spec := range specs {
		collection := core.NewBaseCollection(spec.Name)
		if err := app.Save(collection); err != nil {
			t.Fatal(err)
		}
		ids[spec.Name] = collection.Id
	}
	for _, spec := range specs {
		collection, _ := app.FindCollectionByNameOrId(spec.Name)
		for _, field := range spec.Fields {
			if relation, ok := field["relation"].(string); ok {
				delete(field, "relation")
				field["type"] = "relation"
				field["collectionId"] = ids[relation]
				field["maxSelect"] = 1
			}
		}
		indexes := []string{}
		for i, index := range spec.Indexes {
			kind := "INDEX"
			if index.Unique {
				kind = "UNIQUE INDEX"
			}
			indexes = append(indexes, fmt.Sprintf("CREATE %s idx_%s_%d ON %s (%s)", kind, spec.Name, i, spec.Name, strings.Join(index.Columns, ",")))
		}
		encoded, _ := json.Marshal(map[string]any{"fields": spec.Fields, "indexes": indexes})
		if err := json.Unmarshal(encoded, collection); err != nil {
			t.Fatal(err)
		}
		if err := app.Save(collection); err != nil {
			t.Fatal(err)
		}
	}
	for _, spec := range specs {
		collection, _ := app.FindCollectionByNameOrId(spec.Name)
		encoded, _ := json.Marshal(spec.Rules)
		if err := json.Unmarshal(encoded, collection); err != nil {
			t.Fatal(err)
		}
		if err := app.Save(collection); err != nil {
			t.Fatal(err)
		}
	}
	registerGrading(app)
	return app
}

type gradingHTTP struct {
	t       *testing.T
	app     *tests.TestApp
	handler http.Handler
}

func newGradingHTTP(t *testing.T) gradingHTTP {
	t.Helper()
	app := newGradingTestApp(t)
	router, err := apis.NewRouter(app)
	if err != nil {
		t.Fatal(err)
	}
	if err := app.OnServe().Trigger(&core.ServeEvent{App: app, Router: router}); err != nil {
		t.Fatal(err)
	}
	handler, err := router.BuildMux()
	if err != nil {
		t.Fatal(err)
	}
	return gradingHTTP{t, app, handler}
}

func (h gradingHTTP) user(email string, verified bool) string {
	h.t.Helper()
	collection, _ := h.app.FindCollectionByNameOrId("users")
	record := core.NewRecord(collection)
	record.SetEmail(email)
	record.SetPassword("test-password-123")
	record.SetVerified(verified)
	if err := h.app.Save(record); err != nil {
		h.t.Fatal(err)
	}
	token, err := record.NewAuthToken()
	if err != nil {
		h.t.Fatal(err)
	}
	return token
}

func (h gradingHTTP) request(method, path, token string, body any, status int) map[string]any {
	h.t.Helper()
	var data []byte
	if body != nil {
		data, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, path, bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", token)
	}
	res := httptest.NewRecorder()
	h.handler.ServeHTTP(res, req)
	if res.Code != status {
		h.t.Fatalf("%s %s returned %d, expected %d: %s", method, path, res.Code, status, res.Body.String())
	}
	if strings.HasPrefix(path, "/api/grading/") && res.Header().Get("Cache-Control") != "no-store" && status != 401 {
		h.t.Fatal("Grade operation can be cached")
	}
	result := map[string]any{}
	_ = json.Unmarshal(res.Body.Bytes(), &result)
	return result
}

func (h gradingHTTP) lesson(number int) *core.Record {
	h.t.Helper()
	collection, _ := h.app.FindCollectionByNameOrId("grading_lessons")
	record := core.NewRecord(collection)
	record.Set("number", number)
	record.Set("title", "Chemistry lesson")
	record.Set("hasLab", true)
	record.Set("labAssigned", true)
	record.Set("questions", []map[string]any{{"id": "1.1", "prompt": "Question one"}, {"id": "1.2", "prompt": "Question two"}})
	record.Set("rubric", []map[string]any{{"id": "title", "max": 5}, {"id": "hypothesis", "max": 10}, {"id": "results", "max": 30}})
	if err := h.app.Save(record); err != nil {
		h.t.Fatal(err)
	}
	return record
}

func gradingBody(lesson *core.Record, student, category string, revision int, assessment any, finish bool) map[string]any {
	return map[string]any{"lesson": lesson.Id, "studentEmail": student, "category": category, "expectedRevision": revision, "assessment": assessment, "finish": finish}
}
func gradingDetailed(scores map[string]float64) map[string]any {
	return map[string]any{"kind": "detailed", "scores": scores}
}

func TestGradingAccessAndProtectedReferences(t *testing.T) {
	h := newGradingHTTP(t)
	parent := h.user("ian@obermillers.com", true)
	wells := h.user("wells@obermillers.com", true)
	isla := h.user("isla@obermillers.com", true)
	stranger := h.user("stranger@example.com", true)
	lesson := h.lesson(1)
	draft := h.request("PUT", "/api/grading/grade", parent, gradingBody(lesson, "wells@obermillers.com", "homework", 0, gradingDetailed(map[string]float64{"1.1": 3}), false), 200)
	id := draft["id"].(string)
	collectionPath := "/api/collections/grading_grades/records/"
	for _, token := range []string{"", wells, isla, stranger} {
		h.request("GET", collectionPath+id, token, nil, 404)
	}
	h.request("PATCH", collectionPath+id, parent, map[string]any{"status": "published"}, 403)
	h.request("POST", strings.TrimSuffix(collectionPath, "/"), wells, draft, 403)
	h.request("DELETE", collectionPath+id, parent, nil, 403)
	published := h.request("PUT", "/api/grading/grade", parent, gradingBody(lesson, "wells@obermillers.com", "homework", 1, gradingDetailed(map[string]float64{"1.1": 3, "1.2": 0}), true), 200)
	if published["status"] != "published" {
		t.Fatal("Complete grade was not published")
	}
	h.request("GET", collectionPath+id, wells, nil, 200)
	for _, token := range []string{"", isla, stranger} {
		h.request("GET", collectionPath+id, token, nil, 404)
	}
	for _, token := range []string{isla, stranger} {
		listed := h.request("GET", strings.TrimSuffix(collectionPath, "/"), token, nil, 200)
		if len(listed["items"].([]any)) != 0 {
			t.Fatal("Another account can list Wellington's grade")
		}
	}
	for _, token := range []string{"", stranger} {
		h.request("GET", "/api/collections/grading_lessons/records/"+lesson.Id, token, nil, 404)
	}
	h.request("GET", "/api/collections/grading_lessons/records/"+lesson.Id, wells, nil, 200)
	refCollection, _ := h.app.FindCollectionByNameOrId("grading_references")
	reference := core.NewRecord(refCollection)
	reference.Set("lesson", lesson.Id)
	reference.Set("content", map[string]any{"answers": map[string]string{"1.1": "Private answer"}})
	png, _ := base64.StdEncoding.DecodeString("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jg9sAAAAASUVORK5CYII=")
	file, err := filesystem.NewFileFromBytes(png, "answer.png")
	if err != nil {
		t.Fatal(err)
	}
	reference.Set("figures", []*filesystem.File{file})
	if err := h.app.Save(reference); err != nil {
		t.Fatal(err)
	}
	refPath := "/api/collections/grading_references/records/" + reference.Id
	h.request("GET", refPath, parent, nil, 200)
	for _, token := range []string{"", wells, isla, stranger} {
		h.request("GET", refPath, token, nil, 404)
	}
	filename := reference.GetStringSlice("figures")[0]
	filePath := "/api/files/" + refCollection.Id + "/" + reference.Id + "/" + filename
	h.request("GET", filePath, "", nil, 404)
	users, _ := h.app.FindCollectionByNameOrId("users")
	for _, actor := range []struct {
		email  string
		status int
	}{{"ian@obermillers.com", 200}, {"wells@obermillers.com", 404}, {"isla@obermillers.com", 404}} {
		record, err := h.app.FindFirstRecordByFilter(users.Id, "email = {:email}", map[string]any{"email": actor.email})
		if err != nil {
			t.Fatal(err)
		}
		token, err := record.NewFileToken()
		if err != nil {
			t.Fatal(err)
		}
		h.request("GET", filePath+"?token="+url.QueryEscape(token), "", nil, actor.status)
	}
}

func TestGradingValidationRevisionsAndImportedTotals(t *testing.T) {
	h := newGradingHTTP(t)
	parent := h.user("ian@obermillers.com", true)
	wells := h.user("wells@obermillers.com", true)
	unverified := h.user("not-yet-verified@example.com", false)
	lesson := h.lesson(1)
	body := gradingBody(lesson, "wells@obermillers.com", "homework", 0, gradingDetailed(map[string]float64{"1.1": 3}), false)
	h.request("PUT", "/api/grading/grade", "", body, 401)
	for _, token := range []string{wells, unverified} {
		h.request("PUT", "/api/grading/grade", token, body, 403)
	}
	for _, scores := range []map[string]float64{{"1.1": 4}, {"1.1": -1}, {"1.1": 1.5}, {"unknown": 3}} {
		body["assessment"] = gradingDetailed(scores)
		h.request("PUT", "/api/grading/grade", parent, body, 400)
	}
	body["assessment"] = gradingDetailed(map[string]float64{"1.1": 3})
	body["finish"] = true
	h.request("PUT", "/api/grading/grade", parent, body, 400)
	body["finish"] = false
	h.request("PUT", "/api/grading/grade", parent, body, 200)
	h.request("PUT", "/api/grading/grade", parent, body, 409)
	body["expectedRevision"] = 1
	body["finish"] = true
	body["assessment"] = gradingDetailed(map[string]float64{"1.1": 3, "1.2": 2})
	h.request("PUT", "/api/grading/grade", parent, body, 200)
	body["expectedRevision"] = 2
	body["finish"] = false
	body["assessment"] = gradingDetailed(map[string]float64{"1.1": 0, "1.2": 2})
	updated := h.request("PUT", "/api/grading/grade", parent, body, 200)
	if updated["status"] != "published" {
		t.Fatal("Complete published revision was made a draft")
	}
	body["expectedRevision"] = 3
	body["assessment"] = gradingDetailed(map[string]float64{"1.1": 0})
	updated = h.request("PUT", "/api/grading/grade", parent, body, 200)
	if updated["status"] != "draft" {
		t.Fatal("Missing score was silently counted as zero")
	}
	quiz := gradingBody(lesson, "wells@obermillers.com", "quiz", 0, gradingDetailed(map[string]float64{"percent": 92.75}), true)
	h.request("PUT", "/api/grading/grade", parent, quiz, 200)
	collection, _ := h.app.FindCollectionByNameOrId("grading_grades")
	imported := core.NewRecord(collection)
	imported.Set("lesson", lesson.Id)
	imported.Set("studentEmail", "isla@obermillers.com")
	imported.Set("category", "homework")
	imported.Set("status", "published")
	imported.Set("revision", 1)
	assessment := map[string]any{"kind": "imported", "earned": 5, "possible": 6, "source": "https://docs.google.com/spreadsheets/d/test/edit#range=B33"}
	imported.Set("assessment", assessment)
	if err := h.app.Save(imported); err != nil {
		t.Fatal(err)
	}
	aggregate := gradingBody(lesson, "isla@obermillers.com", "homework", 1, assessment, false)
	assessment["earned"] = 4
	h.request("PUT", "/api/grading/grade", parent, aggregate, 200)
	aggregate["expectedRevision"] = 2
	for _, field := range []string{"possible", "source"} {
		original := assessment[field]
		assessment[field] = "changed"
		h.request("PUT", "/api/grading/grade", parent, aggregate, 400)
		assessment[field] = original
	}
	aggregate["assessment"] = gradingDetailed(map[string]float64{"1.1": 2, "1.2": 2})
	h.request("PUT", "/api/grading/grade", parent, aggregate, 400)
}

func TestGradingUnverifiedParentAndLabSettings(t *testing.T) {
	h := newGradingHTTP(t)
	parent := h.user("ian@obermillers.com", false)
	lesson := h.lesson(1)
	path := "/api/grading/lessons/" + lesson.Id + "/settings"
	settings := map[string]any{"labAssigned": true, "observationOnly": true}
	h.request("PATCH", path, parent, settings, 403)
	user, err := h.app.FindFirstRecordByFilter("users", "email = 'ian@obermillers.com'")
	if err != nil {
		t.Fatal(err)
	}
	user.SetVerified(true)
	if err := h.app.Save(user); err != nil {
		t.Fatal(err)
	}
	parent, _ = user.NewAuthToken()
	h.request("PATCH", path, parent, settings, 200)
	body := gradingBody(lesson, "wells@obermillers.com", "lab", 0, gradingDetailed(map[string]float64{"title": 5, "results": 30}), true)
	result := h.request("PUT", "/api/grading/grade", parent, body, 200)
	if result["status"] != "published" {
		t.Fatal("Observation report incorrectly requires hypothesis")
	}
	settings["observationOnly"] = false
	h.request("PATCH", path, parent, settings, 200)
	updated, err := h.app.FindRecordById("grading_grades", result["id"].(string))
	if err != nil {
		t.Fatal(err)
	}
	if updated.GetString("status") != "draft" || updated.GetInt("revision") != 2 {
		t.Fatal("Restoring hypothesis left a published incomplete lab")
	}
	body["expectedRevision"] = 2
	h.request("PUT", "/api/grading/grade", parent, body, 400)
	settings["labAssigned"] = false
	h.request("PATCH", path, parent, settings, 200)
	h.request("PUT", "/api/grading/grade", parent, body, 400)
	settings["observationOnly"] = true
	h.request("PATCH", path, parent, settings, 200)
}

func TestGradingEmptyDraftAndConcurrentSaves(t *testing.T) {
	h := newGradingHTTP(t)
	parent := h.user("ian@obermillers.com", true)
	lesson := h.lesson(1)
	empty := h.request("PUT", "/api/grading/grade", parent, gradingBody(lesson, "isla@obermillers.com", "homework", 0, gradingDetailed(map[string]float64{}), false), 200)
	assessment, ok := empty["assessment"].(map[string]any)
	if !ok {
		t.Fatal("Missing draft assessment")
	}
	scores, ok := assessment["scores"].(map[string]any)
	if !ok || len(scores) != 0 {
		t.Fatal("An empty draft did not preserve scores:{}")
	}
	body, _ := json.Marshal(gradingBody(lesson, "wells@obermillers.com", "quiz", 0, gradingDetailed(map[string]float64{"percent": 93.5}), true))
	statuses := make(chan int, 2)
	for i := 0; i < 2; i++ {
		go func() {
			req := httptest.NewRequest("PUT", "/api/grading/grade", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", parent)
			res := httptest.NewRecorder()
			h.handler.ServeHTTP(res, req)
			statuses <- res.Code
		}()
	}
	first, second := <-statuses, <-statuses
	if !((first == 200 && second == 409) || (first == 409 && second == 200)) {
		t.Fatalf("Concurrent saves returned %d and %d; expected one save and one conflict", first, second)
	}
	records, err := h.app.FindRecordsByFilter("grading_grades", "lesson = {:lesson} && category = 'quiz'", "", 0, 0, map[string]any{"lesson": lesson.Id})
	if err != nil || len(records) != 1 {
		t.Fatal("Concurrent save created duplicate grades", err)
	}
}

func TestGradingObservationChangeRemovesInapplicableDraftScores(t *testing.T) {
	h := newGradingHTTP(t)
	parent := h.user("ian@obermillers.com", true)
	lesson := h.lesson(1)
	result := h.request("PUT", "/api/grading/grade", parent, gradingBody(lesson, "wells@obermillers.com", "lab", 0, gradingDetailed(map[string]float64{"title": 5, "hypothesis": 10}), false), 200)
	h.request("PATCH", "/api/grading/lessons/"+lesson.Id+"/settings", parent, map[string]any{"labAssigned": true, "observationOnly": true}, 200)
	updated, err := h.app.FindRecordById("grading_grades", result["id"].(string))
	if err != nil {
		t.Fatal(err)
	}
	var assessment gradingAssessment
	if err := updated.UnmarshalJSONField("assessment", &assessment); err != nil {
		t.Fatal(err)
	}
	if _, exists := assessment.Scores["hypothesis"]; exists {
		t.Fatal("Observation-only draft kept an inapplicable hypothesis score")
	}
	if updated.GetInt("revision") != 2 {
		t.Fatal("Settings changed grade data without advancing its revision")
	}
	h.request("PUT", "/api/grading/grade", parent, gradingBody(lesson, "wells@obermillers.com", "lab", 2, gradingDetailed(map[string]float64{"title": 5, "results": 30}), true), 200)
}
