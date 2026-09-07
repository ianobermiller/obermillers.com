package main

import (
	"log"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

const applicationsCollection = "applications"

type application struct {
	Domain          string
	Name            string
	OTPSubject      string
	PasskeysEnabled bool
}

var seedApplications = []application{
	{Domain: "obermillers.com", Name: "Obermiller", PasskeysEnabled: true},
	{Domain: "nfwavemakers.com", Name: "NF Wavemakers", OTPSubject: "NF Wavemakers Login Code", PasskeysEnabled: true},
	{Domain: "localhost", Name: "PocketBase (local)", PasskeysEnabled: true},
}

func registerApplications(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		if err := ensureApplications(app); err != nil {
			log.Printf("applications: could not ensure collection: %v", err)
		}
		return e.Next()
	})

	invalidate := func(e *core.RecordEvent) error {
		err := e.Next()
		if err == nil {
			clearWaCache()
		}
		return err
	}
	app.OnRecordCreate(applicationsCollection).BindFunc(invalidate)
	app.OnRecordUpdate(applicationsCollection).BindFunc(invalidate)
	app.OnRecordDelete(applicationsCollection).BindFunc(invalidate)
}

func ensureApplications(app core.App) error {
	collection, err := app.FindCollectionByNameOrId(applicationsCollection)
	created := false
	if err != nil {
		collection = core.NewBaseCollection(applicationsCollection)
		collection.System = true
		created = true
	}

	changed := created
	if addApplicationFields(collection) {
		changed = true
	}
	if collection.GetIndex("idx_applications_domain") == "" {
		collection.AddIndex("idx_applications_domain", true, "domain", "")
		changed = true
	}
	if changed {
		if err := app.Save(collection); err != nil {
			return err
		}
	}
	if !created {
		return nil
	}
	return seedApplicationRecords(app, collection)
}

func addApplicationFields(collection *core.Collection) bool {
	changed := false
	if collection.Fields.GetByName("domain") == nil {
		collection.Fields.Add(&core.TextField{
			Name:        "domain",
			Required:    true,
			Presentable: true,
			Min:         1,
			Max:         253,
			Help:        "Registrable domain (RP ID). This host and its subdomains share passkeys.",
		})
		changed = true
	}
	if collection.Fields.GetByName("name") == nil {
		collection.Fields.Add(&core.TextField{
			Name:        "name",
			Required:    true,
			Presentable: true,
			Min:         1,
			Max:         120,
			Help:        "Shown in the passkey prompt.",
		})
		changed = true
	}
	if collection.Fields.GetByName("otp_subject") == nil {
		collection.Fields.Add(&core.TextField{
			Name: "otp_subject",
			Max:  200,
			Help: "If set, OTP emails from this domain use this subject instead of the collection template.",
		})
		changed = true
	}
	if collection.Fields.GetByName("passkeys_enabled") == nil {
		collection.Fields.Add(&core.BoolField{
			Name: "passkeys_enabled",
			Help: "Allow WebAuthn on this domain and its subdomains.",
		})
		changed = true
	}
	return changed
}

func seedApplicationRecords(app core.App, collection *core.Collection) error {
	for _, seed := range seedApplications {
		record := core.NewRecord(collection)
		record.Set("domain", seed.Domain)
		record.Set("name", seed.Name)
		record.Set("otp_subject", seed.OTPSubject)
		record.Set("passkeys_enabled", seed.PasskeysEnabled)
		if err := app.Save(record); err != nil {
			return err
		}
	}
	return nil
}

func loadApplications(app core.App) ([]application, error) {
	records, err := app.FindAllRecords(applicationsCollection)
	if err != nil {
		return nil, err
	}
	out := make([]application, 0, len(records))
	for _, record := range records {
		out = append(out, applicationFromRecord(record))
	}
	return out, nil
}

func applicationFromRecord(record *core.Record) application {
	return application{
		Domain:          strings.ToLower(strings.TrimSpace(record.GetString("domain"))),
		Name:            strings.TrimSpace(record.GetString("name")),
		OTPSubject:      strings.TrimSpace(record.GetString("otp_subject")),
		PasskeysEnabled: record.GetBool("passkeys_enabled"),
	}
}

func applicationForHost(apps []application, host string) (application, bool) {
	host = strings.ToLower(strings.TrimSpace(host))
	if host == "" {
		return application{}, false
	}
	best := application{}
	found := false
	for _, app := range apps {
		domain := strings.ToLower(strings.TrimSpace(app.Domain))
		if domain == "" {
			continue
		}
		if host == domain || strings.HasSuffix(host, "."+domain) {
			if !found || len(domain) > len(best.Domain) {
				best = app
				best.Domain = domain
				found = true
			}
		}
	}
	return best, found
}

func passkeyApplicationForHost(apps []application, host string) (application, bool) {
	app, ok := applicationForHost(apps, host)
	if !ok || !app.PasskeysEnabled {
		return application{}, false
	}
	return app, true
}

func displayNameFor(app application) string {
	if app.Name != "" {
		return app.Name
	}
	return app.Domain
}

func applicationDomains(apps []application) []string {
	ids := make([]string, 0, len(apps))
	for _, app := range apps {
		if app.Domain != "" {
			ids = append(ids, app.Domain)
		}
	}
	return ids
}
