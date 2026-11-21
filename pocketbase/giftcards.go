package main

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"unicode/utf8"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

const giftCardCipherPrefix = "gcv1:"
const defaultGiftCardKeyFile = "/etc/pocketbase/gift-card.key"

func loadGiftCardCipher(path string) (cipher.AEAD, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, errors.New("gift card key file is unavailable")
	}
	if !info.Mode().IsRegular() || info.Mode().Perm()&0077 != 0 {
		return nil, errors.New("gift card key file must be a regular file with owner-only permissions")
	}
	encoded, err := os.ReadFile(path)
	if err != nil {
		return nil, errors.New("gift card key file could not be read")
	}
	key, err := base64.StdEncoding.DecodeString(strings.TrimSpace(string(encoded)))
	if err != nil || len(key) != 32 {
		return nil, errors.New("gift card key file must contain a base64-encoded 32-byte key")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCMWithRandomNonce(block)
}

func sealGiftCardValue(box cipher.AEAD, id, field, plain string) string {
	if plain == "" {
		return ""
	}
	encrypted := box.Seal(nil, nil, []byte(plain), []byte("giftcards/"+id+"/"+field))
	return giftCardCipherPrefix + base64.RawStdEncoding.EncodeToString(encrypted)
}

func openGiftCardValue(box cipher.AEAD, id, field, value string) (string, error) {
	if value == "" {
		return "", nil
	}
	if !strings.HasPrefix(value, giftCardCipherPrefix) {
		return "", errors.New("gift card details are not encrypted")
	}
	encrypted, err := base64.RawStdEncoding.DecodeString(strings.TrimPrefix(value, giftCardCipherPrefix))
	if err != nil {
		return "", errors.New("gift card details could not be decrypted")
	}
	plain, err := box.Open(nil, nil, encrypted, []byte("giftcards/"+id+"/"+field))
	if err != nil {
		return "", errors.New("gift card details could not be decrypted")
	}
	return string(plain), nil
}

func registerGiftCards(app core.App, keyFile string) {
	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		box, err := loadGiftCardCipher(keyFile)
		if err != nil {
			return fmt.Errorf("gift cards: %w; set GIFT_CARD_KEY_FILE to the private key file", err)
		}
		bindGiftCardEncryption(app, box)
		if err := migrateGiftCardSecrets(app, box); err != nil {
			return err
		}
		e.Router.POST("/api/giftcards/{id}/reveal", func(e *core.RequestEvent) error {
			return revealGiftCard(e, box)
		}).Bind(apis.RequireAuth("users"))
		registerGiftCardBalances(e)
		return e.Next()
	})
}

func bindGiftCardEncryption(app core.App, box cipher.AEAD) {
	// Hidden storage fields cannot be set through PocketBase's regular form.
	// Accept separate write-only inputs after its ownership rules have passed.
	loadSecrets := func(e *core.RecordRequestEvent) error {
		info, err := e.RequestInfo()
		if err != nil {
			return e.BadRequestError("Invalid request", nil)
		}
		original := e.Record.Original()
		e.Record.Set("balanceCheckedAt", original.GetString("balanceCheckedAt"))
		_, numberChanged := info.Body["cardNumber"]
		_, pinChanged := info.Body["cardPin"]
		if e.Record.IsNew() || numberChanged || pinChanged ||
			e.Record.GetFloat("balance") != original.GetFloat("balance") ||
			e.Record.GetString("currency") != original.GetString("currency") ||
			e.Record.GetString("merchant") != original.GetString("merchant") {
			e.Record.Set("balanceCheckedAt", "")
		}
		for input, field := range map[string]string{"cardNumber": "number", "cardPin": "pin"} {
			if value, exists := info.Body[input]; exists {
				plain, ok := value.(string)
				if !ok {
					return e.BadRequestError("Card number and PIN must be text", nil)
				}
				e.Record.Set(field, plain)
			}
		}
		return e.Next()
	}
	app.OnRecordCreateRequest("giftcards").BindFunc(loadSecrets)
	app.OnRecordUpdateRequest("giftcards").BindFunc(loadSecrets)
	protect := func(e *core.RecordEvent) error {
		if e.Record.Id == "" {
			e.Record.Id = core.GenerateDefaultRandomId()
		}
		for _, field := range []string{"number", "pin"} {
			value := e.Record.GetString(field)
			original := e.Record.Original().GetString(field)
			if !e.Record.IsNew() && value == original && strings.HasPrefix(value, giftCardCipherPrefix) {
				// Authenticate stored ciphertext even for metadata-only edits. This also
				// rejects a wrong key or a ciphertext copied from another card or field.
				if _, err := openGiftCardValue(box, e.Record.Id, field, value); err != nil {
					return err
				}
				continue
			}
			limit := 200
			if field == "pin" {
				limit = 100
			}
			if utf8.RuneCountInString(value) > limit {
				return errors.New("gift card number or PIN is too long")
			}
			e.Record.Set(field, sealGiftCardValue(box, e.Record.Id, field, value))
		}
		return e.Next()
	}
	app.OnRecordCreate("giftcards").BindFunc(protect)
	app.OnRecordUpdate("giftcards").BindFunc(protect)
	app.OnRecordEnrich("giftcards").BindFunc(func(e *core.RecordEnrichEvent) error {
		e.Record.Hide("number", "pin")
		e.Record.WithCustomData(true)
		e.Record.Set("hasNumber", e.Record.GetString("number") != "")
		e.Record.Set("hasPin", e.Record.GetString("pin") != "")
		return e.Next()
	})
}

func migrateGiftCardSecrets(app core.App, box cipher.AEAD) error {
	collection, err := app.FindCollectionByNameOrId("giftcards")
	if err != nil {
		return nil
	} // The schema setup creates this collection later.
	// Updating the field definitions also protects installations of the earlier
	// plaintext schema. All builtin responses keep these fields hidden.
	for _, name := range []string{"number", "pin"} {
		field, ok := collection.Fields.GetByName(name).(*core.TextField)
		if !ok {
			return errors.New("gift card secret fields are missing")
		}
		field.Hidden = true
		field.Max = 512
		field.Pattern = "^$|^gcv1:[A-Za-z0-9+/]+$"
	}
	if err := app.Save(collection); err != nil {
		return err
	}
	return app.RunInTransaction(func(tx core.App) error {
		records, err := tx.FindAllRecords("giftcards")
		if err != nil {
			return err
		}
		for _, record := range records {
			migrate := false
			for _, field := range []string{"number", "pin"} {
				value := record.GetString(field)
				if value == "" {
					continue
				}
				if strings.HasPrefix(value, giftCardCipherPrefix) {
					if _, err := openGiftCardValue(box, record.Id, field, value); err != nil {
						return errors.New("gift card encryption check failed; restore the correct key before starting")
					}
				} else {
					migrate = true
				}
			}
			if migrate {
				if err := tx.Save(record); err != nil {
					return errors.New("gift card encryption migration failed")
				}
			}
		}
		return nil
	})
}

func revealGiftCard(e *core.RequestEvent, box cipher.AEAD) error {
	e.Response.Header().Set("Cache-Control", "no-store")
	record, err := e.App.FindRecordById("giftcards", e.Request.PathValue("id"))
	if err != nil {
		return e.NotFoundError("Gift card not found", nil)
	}
	info, err := e.RequestInfo()
	if err != nil {
		return e.BadRequestError("Invalid request", nil)
	}
	allowed, err := e.App.CanAccessRecord(record, info, record.Collection().ViewRule)
	if err != nil || !allowed {
		return e.NotFoundError("Gift card not found", nil)
	}
	number, err := openGiftCardValue(box, record.Id, "number", record.GetString("number"))
	if err != nil {
		return e.InternalServerError("Gift card details are unavailable", nil)
	}
	pin, err := openGiftCardValue(box, record.Id, "pin", record.GetString("pin"))
	if err != nil {
		return e.InternalServerError("Gift card details are unavailable", nil)
	}
	return e.JSON(http.StatusOK, map[string]string{"number": number, "pin": pin})
}
