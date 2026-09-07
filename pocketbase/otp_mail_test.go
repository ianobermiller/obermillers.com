package main

import "testing"

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
