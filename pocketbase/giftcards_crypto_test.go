package main

import (
	"crypto/aes"
	"crypto/cipher"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func TestGiftCardCipher(t *testing.T) {
	path := testGiftCardKey(t)
	box, err := loadGiftCardCipher(path)
	if err != nil {
		t.Fatal(err)
	}
	value := sealGiftCardValue(box, "card-a", "number", "redeem-me")
	another := sealGiftCardValue(box, "card-a", "number", "redeem-me")
	if value == another {
		t.Fatal("encryption reused the nonce")
	}
	plain, err := openGiftCardValue(box, "card-a", "number", value)
	if err != nil || plain != "redeem-me" {
		t.Fatal("round trip failed")
	}
	for _, test := range []struct{ id, field, value string }{
		{"card-b", "number", value},
		{"card-a", "pin", value},
		{"card-a", "number", "plaintext"},
		{"card-a", "number", giftCardCipherPrefix + "!invalid!"},
		{"card-a", "number", giftCardCipherPrefix + "AAAA"},
		{"card-a", "number", value[:len(giftCardCipherPrefix)] + "AAAA" + value[len(giftCardCipherPrefix)+4:]},
	} {
		if _, err := openGiftCardValue(box, test.id, test.field, test.value); err == nil {
			t.Fatal("accepted tampered ciphertext, plaintext, or wrong card/field")
		}
	}
	wrongBlock, _ := aes.NewCipher([]byte(strings.Repeat("x", 32)))
	wrongBox, _ := cipher.NewGCMWithRandomNonce(wrongBlock)
	if _, err := openGiftCardValue(wrongBox, "card-a", "number", value); err == nil {
		t.Fatal("wrong key decrypted the value")
	}
	if sealGiftCardValue(box, "card-a", "pin", "") != "" {
		t.Fatal("empty optional value was not preserved")
	}
	if _, err := loadGiftCardCipher(filepath.Join(t.TempDir(), "missing.key")); err == nil {
		t.Fatal("accepted missing key")
	}
	if err := os.Chmod(path, 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := loadGiftCardCipher(path); err == nil {
		t.Fatal("accepted publicly readable key")
	}
	if err := os.Chmod(path, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("invalid-key"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := loadGiftCardCipher(path); err == nil {
		t.Fatal("accepted invalid key")
	}
}

func TestGiftCardMigration(t *testing.T) {
	app := newGiftCardTestApp(t)
	users, _ := app.FindCollectionByNameOrId("users")
	owner := core.NewRecord(users)
	owner.SetEmail("legacy@example.com")
	owner.SetPassword("test-password-123")
	if err := app.Save(owner); err != nil {
		t.Fatal(err)
	}
	collection, _ := app.FindCollectionByNameOrId("giftcards")
	for _, name := range []string{"number", "pin"} {
		field := collection.Fields.GetByName(name).(*core.TextField)
		field.Hidden = false
		field.Pattern = ""
	}
	if err := app.Save(collection); err != nil {
		t.Fatal(err)
	}
	legacy := core.NewRecord(collection)
	legacy.Set("owner", owner.Id)
	legacy.Set("merchant", "Legacy card")
	legacy.Set("currency", "USD")
	legacy.Set("number", "legacy-code")
	legacy.Set("pin", "4321")
	if err := app.Save(legacy); err != nil {
		t.Fatal(err)
	}
	keyFile := testGiftCardKey(t)
	registerGiftCards(app, keyFile)
	router, _ := apis.NewRouter(app)
	if err := app.OnServe().Trigger(&core.ServeEvent{App: app, Router: router}); err != nil {
		t.Fatal(err)
	}
	stored, _ := app.FindRecordById("giftcards", legacy.Id)
	ciphertext := stored.GetString("number")
	if ciphertext == "legacy-code" || !strings.HasPrefix(ciphertext, giftCardCipherPrefix) {
		t.Fatal("legacy plaintext remained in database")
	}
	box, _ := loadGiftCardCipher(keyFile)
	plain, err := openGiftCardValue(box, stored.Id, "number", ciphertext)
	if err != nil || plain != "legacy-code" {
		t.Fatal("migration lost legacy code")
	}
	if err := migrateGiftCardSecrets(app, box); err != nil {
		t.Fatal(err)
	}
	stored, _ = app.FindRecordById("giftcards", legacy.Id)
	if stored.GetString("number") != ciphertext {
		t.Fatal("repeated migration re-encrypted ciphertext")
	}
	secured, _ := app.FindCollectionByNameOrId("giftcards")
	if !secured.Fields.GetByName("number").GetHidden() || !secured.Fields.GetByName("pin").GetHidden() {
		t.Fatal("legacy schema still exposes secret fields")
	}
	wrongBlock, _ := aes.NewCipher([]byte(strings.Repeat("z", 32)))
	wrongBox, _ := cipher.NewGCMWithRandomNonce(wrongBlock)
	if err := migrateGiftCardSecrets(app, wrongBox); err == nil {
		t.Fatal("migration accepted the wrong key")
	}
	stored, _ = app.FindRecordById("giftcards", legacy.Id)
	if stored.GetString("number") != ciphertext {
		t.Fatal("wrong key changed existing ciphertext")
	}
}

func TestGiftCardMissingKeyStopsServe(t *testing.T) {
	app := newGiftCardTestApp(t)
	registerGiftCards(app, filepath.Join(t.TempDir(), "missing.key"))
	router, _ := apis.NewRouter(app)
	if err := app.OnServe().Trigger(&core.ServeEvent{App: app, Router: router}); err == nil {
		t.Fatal("server started without its encryption key")
	}
}
