package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
)

func main() {
	app := pocketbase.New()

	// pb_hooks (ballots link-profile). MigrationsDir points at a directory that
	// does not exist so JS files already applied from pb_migrations are not
	// evaluated again when the process starts.
	jsvm.MustRegister(app, jsvm.Config{
		HooksWatch:    false,
		HooksPoolSize: 8,
		MigrationsDir: "pb_js_migrations_none",
	})

	registerApplications(app)
	registerAccount(app)
	registerPasskey(app)
	registerOTPMail(app)

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
