package main

import "testing"

func TestValidateNewPassword(t *testing.T) {
	tests := []struct {
		password string
		confirm  string
		wantErr  bool
	}{
		{password: "short", confirm: "short", wantErr: true},
		{password: "longenough", confirm: "mismatchxx", wantErr: true},
		{password: "longenough", confirm: "longenough", wantErr: false},
	}
	for _, tt := range tests {
		err := validateNewPassword(tt.password, tt.confirm)
		if (err != nil) != tt.wantErr {
			t.Errorf("validateNewPassword(%q, %q) err=%v wantErr=%v", tt.password, tt.confirm, err, tt.wantErr)
		}
	}
}
