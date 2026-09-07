package main

import (
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
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

	app.OnMailerRecordOTPSend().BindFunc(func(e *core.MailerRecordEvent) error {
		if e.Record != nil && e.Message != nil {
			password, _ := e.Meta["password"].(string)
			apps, err := loadApplications(e.App)
			if err != nil {
				return e.Next()
			}
			if subject := otpMailSubjectForOrigin(apps, takeOTPOrigin(e.Record.Id, password)); subject != "" {
				e.Message.Subject = subject
			}
		}
		return e.Next()
	})
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
	if recordId == "" || password == "" || origin == "" {
		return
	}
	now := time.Now()
	otpOriginStore.Lock()
	defer otpOriginStore.Unlock()
	for key, item := range otpOriginStore.data {
		if now.Sub(item.createdAt) > 2*time.Minute {
			delete(otpOriginStore.data, key)
		}
	}
	otpOriginStore.data[otpOriginKey(recordId, password)] = otpOriginItem{
		origin:    origin,
		createdAt: now,
	}
}

func takeOTPOrigin(recordId, password string) string {
	if recordId == "" || password == "" {
		return ""
	}
	key := otpOriginKey(recordId, password)
	otpOriginStore.Lock()
	defer otpOriginStore.Unlock()
	item, ok := otpOriginStore.data[key]
	if !ok {
		return ""
	}
	delete(otpOriginStore.data, key)
	return item.origin
}
