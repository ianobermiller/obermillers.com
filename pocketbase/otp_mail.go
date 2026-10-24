package main

import (
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
)

type otpOriginItem struct {
	origin    string
	createdAt time.Time
}

var otpOriginStore = struct {
	sync.Mutex
	data map[string]otpOriginItem
}{data: map[string]otpOriginItem{}}

func registerOTPMail(app *pocketbase.PocketBase) {
	app.OnRecordRequestOTPRequest().BindFunc(func(e *core.RecordCreateOTPRequestEvent) error {
		if e.Record != nil {
			rememberOTPOrigin(e.Record.Id, e.Password, originFromRequest(e.RequestEvent))
		}
		return e.Next()
	})

	// The login alert is sent inside the auth handler, so the origin has to be
	// stored before Next() runs that handler.
	app.OnRecordAuthRequest().BindFunc(func(e *core.RecordAuthRequestEvent) error {
		if e.Record != nil {
			rememberAuthOrigin(e.Record.Id, originFromRequest(e.RequestEvent))
		}
		return e.Next()
	})

	app.OnMailerRecordOTPSend().BindFunc(func(e *core.MailerRecordEvent) error {
		if e.Record != nil && e.Message != nil {
			password, _ := e.Meta["password"].(string)
			apps, err := loadApplications(e.App)
			if err != nil {
				return e.Next()
			}
			origin := takeOTPOrigin(e.Record.Id, password)
			brandAuthMail(e.Message, e.App.Settings().Meta.AppName, apps, origin)
			if subject := otpMailSubjectForOrigin(apps, origin); subject != "" {
				e.Message.Subject = subject
			}
		}
		return e.Next()
	})

	app.OnMailerRecordAuthAlertSend().BindFunc(func(e *core.MailerRecordEvent) error {
		if e.Record != nil && e.Message != nil {
			apps, err := loadApplications(e.App)
			if err != nil {
				return e.Next()
			}
			brandAuthMail(e.Message, e.App.Settings().Meta.AppName, apps, takeAuthOrigin(e.Record.Id))
		}
		return e.Next()
	})
}

// mailBrandName is the name to write into an auth email. Empty means keep the
// PocketBase app name. A name that is the same brand as the app name
// ("Obermiller" and "Obermillers") stays on the shared app name.
func mailBrandName(settingsAppName string, app application) string {
	name := strings.TrimSpace(app.Name)
	settingsAppName = strings.TrimSpace(settingsAppName)
	if name == "" || settingsAppName == "" || strings.EqualFold(name, settingsAppName) {
		return ""
	}
	lowerName := strings.ToLower(name)
	lowerSettings := strings.ToLower(settingsAppName)
	if strings.HasPrefix(lowerSettings, lowerName) || strings.HasPrefix(lowerName, lowerSettings) {
		return ""
	}
	return name
}

func brandAuthMail(message *mailer.Message, settingsAppName string, apps []application, origin string) {
	if message == nil {
		return
	}
	app, ok := applicationForHost(apps, hostFromOrigin(origin))
	if !ok {
		return
	}
	brand := mailBrandName(settingsAppName, app)
	if brand == "" {
		return
	}
	message.Subject = strings.ReplaceAll(message.Subject, settingsAppName, brand)
	message.HTML = strings.ReplaceAll(message.HTML, settingsAppName, brand)
	message.Text = strings.ReplaceAll(message.Text, settingsAppName, brand)
}

func originFromRequest(e *core.RequestEvent) string {
	if e == nil || e.Request == nil {
		return ""
	}
	origin := strings.TrimSpace(e.Request.Header.Get("Origin"))
	if origin != "" {
		return origin
	}
	return strings.TrimSpace(e.Request.Header.Get("Referer"))
}

func otpMailSubjectForOrigin(apps []application, origin string) string {
	host := hostFromOrigin(origin)
	if host == "" {
		return ""
	}
	app, ok := applicationForHost(apps, host)
	if !ok {
		return ""
	}
	return app.OTPSubject
}

func hostFromOrigin(origin string) string {
	origin = strings.TrimSpace(origin)
	if origin == "" {
		return ""
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return ""
	}
	host := strings.ToLower(parsed.Hostname())
	if host != "" {
		return host
	}
	return strings.ToLower(origin)
}

func otpOriginKey(recordId, password string) string {
	return recordId + "\x00" + password
}

func rememberOTPOrigin(recordId, password, origin string) {
	if recordId == "" || password == "" {
		return
	}
	rememberOrigin(otpOriginKey(recordId, password), origin)
}

func takeOTPOrigin(recordId, password string) string {
	if recordId == "" || password == "" {
		return ""
	}
	return takeOrigin(otpOriginKey(recordId, password))
}

func authOriginKey(recordId string) string {
	return "auth\x00" + recordId
}

func rememberAuthOrigin(recordId, origin string) {
	if recordId == "" {
		return
	}
	rememberOrigin(authOriginKey(recordId), origin)
}

func takeAuthOrigin(recordId string) string {
	if recordId == "" {
		return ""
	}
	return takeOrigin(authOriginKey(recordId))
}

func rememberOrigin(key, origin string) {
	if key == "" || origin == "" {
		return
	}
	now := time.Now()
	otpOriginStore.Lock()
	defer otpOriginStore.Unlock()
	for storedKey, item := range otpOriginStore.data {
		if now.Sub(item.createdAt) > 2*time.Minute {
			delete(otpOriginStore.data, storedKey)
		}
	}
	otpOriginStore.data[key] = otpOriginItem{
		origin:    origin,
		createdAt: now,
	}
}

func takeOrigin(key string) string {
	if key == "" {
		return ""
	}
	otpOriginStore.Lock()
	defer otpOriginStore.Unlock()
	item, ok := otpOriginStore.data[key]
	if !ok {
		return ""
	}
	delete(otpOriginStore.data, key)
	return item.origin
}
