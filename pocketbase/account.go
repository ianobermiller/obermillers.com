package main

import (
	"errors"
	"net/http"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

const minPasswordLength = 8

func validateNewPassword(password, confirm string) error {
	if len(password) < minPasswordLength {
		return errors.New("password must be at least 8 characters")
	}
	if password != confirm {
		return errors.New("passwords do not match")
	}
	return nil
}

type passwordBody struct {
	Password        string `json:"password"`
	PasswordConfirm string `json:"passwordConfirm"`
}

func registerAccount(app *pocketbase.PocketBase) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		e.Router.POST("/api/account/password", setOwnPassword).Bind(apis.RequireAuth("users"))
		return e.Next()
	})
}

func setOwnPassword(e *core.RequestEvent) error {
	var body passwordBody
	if err := e.BindBody(&body); err != nil {
		return errorRes(e, http.StatusBadRequest, "invalid body")
	}
	if err := validateNewPassword(body.Password, body.PasswordConfirm); err != nil {
		return errorRes(e, http.StatusBadRequest, err.Error())
	}

	e.Auth.SetPassword(body.Password)
	if err := e.App.Save(e.Auth); err != nil {
		return errorRes(e, http.StatusInternalServerError, err.Error())
	}

	return authRes(e, e.Auth)
}
