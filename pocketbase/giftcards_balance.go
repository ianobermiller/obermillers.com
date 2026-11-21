package main

import (
	"net/http"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
)

func registerGiftCardBalances(e *core.ServeEvent) {
	e.Router.POST("/api/giftcards/{id}/balance-check", confirmGiftCardBalance).Bind(apis.RequireAuth("users"))
}

func confirmGiftCardBalance(e *core.RequestEvent) error {
	e.Response.Header().Set("Cache-Control", "no-store")
	var body struct {
		Balance         *int    `json:"balance"`
		ExpectedUpdated *string `json:"expectedUpdated"`
	}
	if err := e.BindBody(&body); err != nil || body.Balance == nil || body.ExpectedUpdated == nil || *body.Balance < 0 || *body.Balance > 100000000 {
		return e.BadRequestError("Enter a valid balance", nil)
	}
	var checked *core.Record
	err := e.App.RunInTransaction(func(tx core.App) error {
		record, err := tx.FindRecordById("giftcards", e.Request.PathValue("id"))
		if err != nil || record.GetString("owner") != e.Auth.Id {
			return e.NotFoundError("Gift card not found", nil)
		}
		if record.Collection().Fields.GetByName("balanceCheckedAt") == nil {
			return e.Error(http.StatusServiceUnavailable, "Balance checking is unavailable", nil)
		}
		if record.GetString("updated") != *body.ExpectedUpdated {
			return e.Error(http.StatusConflict, "This card changed. Refresh and check its balance again.", nil)
		}
		record.Set("balance", *body.Balance)
		record.Set("balanceCheckedAt", types.NowDateTime())
		if err := tx.Save(record); err != nil {
			return e.BadRequestError("Could not save the checked balance", nil)
		}
		checked = record
		return nil
	})
	if err != nil {
		return err
	}
	if err := apis.EnrichRecord(e, checked); err != nil {
		return e.InternalServerError("Could not load the saved card", nil)
	}
	return e.JSON(http.StatusOK, checked)
}
