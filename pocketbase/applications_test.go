package main

import "testing"

func TestApplicationForHost(t *testing.T) {
	apps := seedApplications
	tests := []struct {
		host string
		want string
		ok   bool
	}{
		{host: "bank.obermillers.com", want: "obermillers.com", ok: true},
		{host: "obermillers.com", want: "obermillers.com", ok: true},
		{host: "nfwavemakers.com", want: "nfwavemakers.com", ok: true},
		{host: "ballot.nfwavemakers.com", want: "nfwavemakers.com", ok: true},
		{host: "localhost", want: "localhost", ok: true},
		{host: "example.com", want: "", ok: false},
		{host: "", want: "", ok: false},
	}
	for _, tt := range tests {
		got, ok := applicationForHost(apps, tt.host)
		if ok != tt.ok || got.Domain != tt.want {
			t.Errorf("applicationForHost(%q) = (%q, %v), want (%q, %v)", tt.host, got.Domain, ok, tt.want, tt.ok)
		}
	}
}

func TestApplicationForHostPrefersLongerDomain(t *testing.T) {
	apps := []application{
		{Domain: "nfwavemakers.com", Name: "NF Wavemakers", PasskeysEnabled: true},
		{Domain: "ballot.nfwavemakers.com", Name: "Ballot", PasskeysEnabled: false},
	}
	got, ok := applicationForHost(apps, "ballot.nfwavemakers.com")
	if !ok || got.Domain != "ballot.nfwavemakers.com" {
		t.Fatalf("got %+v ok=%v", got, ok)
	}
	if _, passkeysOK := passkeyApplicationForHost(apps, "ballot.nfwavemakers.com"); passkeysOK {
		t.Fatal("expected passkeys disabled for more specific domain")
	}
}
