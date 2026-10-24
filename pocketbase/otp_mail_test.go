package main

import (
	"testing"

	"github.com/pocketbase/pocketbase/tools/mailer"
)

func TestOtpMailSubjectForOrigin(t *testing.T) {
	apps := seedApplications
	tests := []struct {
		origin string
		want   string
	}{
		{origin: "https://nfwavemakers.com", want: "NF Wavemakers Login Code"},
		{origin: "https://ballot.nfwavemakers.com", want: "NF Wavemakers Login Code"},
		{origin: "https://nfwavemakers.com/login", want: "NF Wavemakers Login Code"},
		{origin: "https://bank.obermillers.com", want: ""},
		{origin: "https://obermillers.com", want: ""},
		{origin: "http://localhost:8090", want: ""},
		{origin: "", want: ""},
		{origin: "not a url", want: ""},
	}
	for _, tt := range tests {
		got := otpMailSubjectForOrigin(apps, tt.origin)
		if got != tt.want {
			t.Errorf("otpMailSubjectForOrigin(%q) = %q, want %q", tt.origin, got, tt.want)
		}
	}
}

func TestMailBrandName(t *testing.T) {
	tests := []struct {
		name     string
		settings string
		app      application
		want     string
	}{
		{
			name:     "different brand",
			settings: "Obermillers",
			app:      application{Name: "NF Wavemakers"},
			want:     "NF Wavemakers",
		},
		{
			name:     "same brand shorter prompt",
			settings: "Obermillers",
			app:      application{Name: "Obermiller"},
			want:     "",
		},
		{
			name:     "same name",
			settings: "Obermillers",
			app:      application{Name: "Obermillers"},
			want:     "",
		},
		{
			name:     "empty application name",
			settings: "Obermillers",
			app:      application{},
			want:     "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mailBrandName(tt.settings, tt.app)
			if got != tt.want {
				t.Fatalf("mailBrandName() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBrandAuthMail(t *testing.T) {
	message := &mailer.Message{
		Subject: "OTP for Obermillers",
		HTML:    "<p>We noticed a login to your Obermillers account.</p><p>Obermillers team</p>",
	}
	brandAuthMail(message, "Obermillers", seedApplications, "https://ballot.nfwavemakers.com")
	if message.Subject != "OTP for NF Wavemakers" {
		t.Fatalf("subject = %q", message.Subject)
	}
	if message.HTML != "<p>We noticed a login to your NF Wavemakers account.</p><p>NF Wavemakers team</p>" {
		t.Fatalf("html = %q", message.HTML)
	}

	family := &mailer.Message{Subject: "OTP for Obermillers", HTML: "Obermillers team"}
	brandAuthMail(family, "Obermillers", seedApplications, "https://bank.obermillers.com")
	if family.Subject != "OTP for Obermillers" || family.HTML != "Obermillers team" {
		t.Fatalf("family mail changed: subject=%q html=%q", family.Subject, family.HTML)
	}
}

func TestRememberAndTakeAuthOrigin(t *testing.T) {
	rememberAuthOrigin("user1", "https://nfwavemakers.com")
	got := takeAuthOrigin("user1")
	if got != "https://nfwavemakers.com" {
		t.Fatalf("takeAuthOrigin = %q, want origin", got)
	}
	if second := takeAuthOrigin("user1"); second != "" {
		t.Fatalf("second takeAuthOrigin = %q, want empty", second)
	}
}

func TestRememberAndTakeOTPOrigin(t *testing.T) {
	rememberOTPOrigin("user1", "123456", "https://nfwavemakers.com")
	got := takeOTPOrigin("user1", "123456")
	if got != "https://nfwavemakers.com" {
		t.Fatalf("takeOTPOrigin = %q, want origin", got)
	}
	if second := takeOTPOrigin("user1", "123456"); second != "" {
		t.Fatalf("second takeOTPOrigin = %q, want empty", second)
	}
}
