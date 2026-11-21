package main

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// Exercise the actual JS schema through PocketBase's HTTP handlers and a temporary
// database. No listening server or shared development data is involved.
func newGiftCardTestApp(t *testing.T) *tests.TestApp {
	t.Helper()
	app, err := tests.NewTestApp(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(app.Cleanup)
	users, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		users = core.NewAuthCollection("users")
		if err := app.Save(users); err != nil {
			t.Fatal(err)
		}
	}
	output, err := exec.Command("node", "--input-type=module", "-e", `import {giftCardSchema} from '../src/gift-cards/pocketbase.schema.mjs'; process.stdout.write(JSON.stringify(giftCardSchema));`).Output()
	if err != nil {
		t.Fatal(err)
	}
	var specs []struct {
		Name   string
		Fields []map[string]any
		Rules  map[string]any
	}
	if err := json.Unmarshal(output, &specs); err != nil {
		t.Fatal(err)
	}
	ids := map[string]string{"users": users.Id}
	for _, spec := range specs {
		collection := core.NewBaseCollection(spec.Name)
		if err := app.Save(collection); err != nil {
			t.Fatal(err)
		}
		ids[spec.Name] = collection.Id
	}
	for _, spec := range specs {
		collection, _ := app.FindCollectionByNameOrId(spec.Name)
		for _, field := range spec.Fields {
			if relation, ok := field["relation"].(string); ok {
				delete(field, "relation")
				field["type"] = "relation"
				field["collectionId"] = ids[relation]
				field["maxSelect"] = 1
			}
		}
		body := map[string]any{"fields": spec.Fields}
		encoded, _ := json.Marshal(body)
		if err := json.Unmarshal(encoded, collection); err != nil {
			t.Fatal(err)
		}
		if err := app.Save(collection); err != nil {
			t.Fatal(err)
		}
	}
	for _, spec := range specs {
		collection, _ := app.FindCollectionByNameOrId(spec.Name)
		encoded, _ := json.Marshal(spec.Rules)
		if err := json.Unmarshal(encoded, collection); err != nil {
			t.Fatal(err)
		}
		if err := app.Save(collection); err != nil {
			t.Fatal(err)
		}
	}

	return app
}

func testGiftCardKey(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "gift-card.key")
	if err := os.WriteFile(path, []byte(base64.StdEncoding.EncodeToString([]byte("01234567890123456789012345678901"))), 0600); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestGiftCardAccess(t *testing.T) {
	app := newGiftCardTestApp(t)
	users, _ := app.FindCollectionByNameOrId("users")
	registerGiftCards(app, testGiftCardKey(t))

	newUser := func(email string, verified bool) (*core.Record, string) {
		r := core.NewRecord(users)
		r.SetEmail(email)
		r.SetPassword("test-password-123")
		r.SetVerified(verified)
		if err := app.Save(r); err != nil {
			t.Fatal(err)
		}
		token, err := r.NewAuthToken()
		if err != nil {
			t.Fatal(err)
		}
		return r, token
	}
	owner, ownerToken := newUser("owner@example.com", true)
	stranger, strangerToken := newUser("stranger@example.com", true)
	recipient, recipientToken := newUser("recipient@example.com", true)
	unverified, unverifiedToken := newUser("unverified@example.com", false)
	router, err := apis.NewRouter(app)
	if err != nil {
		t.Fatal(err)
	}
	event := &core.ServeEvent{App: app, Router: router}
	if err := app.OnServe().Trigger(event); err != nil {
		t.Fatal(err)
	}
	handler, err := router.BuildMux()
	if err != nil {
		t.Fatal(err)
	}
	request := func(method, collection, id, token, body string, status int) map[string]any {
		t.Helper()
		path := "/api/collections/" + collection + "/records"
		if collection == "" {
			path = id
		} else if id != "" {
			path += "/" + id
		}
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		if token != "" {
			req.Header.Set("Authorization", token)
		}
		res := httptest.NewRecorder()
		handler.ServeHTTP(res, req)
		if res.Code != status {
			t.Fatalf("%s %s: status %d, want %d: %s", method, path, res.Code, status, res.Body.String())
		}
		if strings.Contains(path, "/reveal") && status == 200 && res.Header().Get("Cache-Control") != "no-store" {
			t.Fatal("reveal response can be cached")
		}
		result := map[string]any{}
		_ = json.Unmarshal(res.Body.Bytes(), &result)
		return result
	}
	cardBody := `{"owner":"` + owner.Id + `","merchant":"Coffee","balance":2500,"currency":"USD","cardNumber":"secret-code","cardPin":"1234"}`
	request(http.MethodPost, "giftcards", "", "", cardBody, 400)
	request(http.MethodPost, "giftcards", "", strangerToken, cardBody, 400)
	created := request(http.MethodPost, "giftcards", "", ownerToken, cardBody, 200)
	card := created["id"].(string)
	private := request(http.MethodPost, "giftcards", "", ownerToken, cardBody, 200)
	privateID := private["id"].(string)
	request(http.MethodGet, "giftcards", card, "", "", 404)
	request(http.MethodGet, "giftcards", card, strangerToken, "", 404)
	listed := request(http.MethodGet, "giftcards", "", strangerToken, "", 200)
	if len(listed["items"].([]any)) != 0 {
		t.Fatal("stranger can list private cards")
	}
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"owner":"`+stranger.Id+`"}`, 404)
	shareBody := `{"owner":"` + owner.Id + `","email":"recipient@example.com"}`
	request(http.MethodPost, "giftcard_shares", "", strangerToken, shareBody, 400)
	share := request(http.MethodPost, "giftcard_shares", "", ownerToken, shareBody, 200)
	request(http.MethodGet, "giftcards", privateID, recipientToken, "", 200)
	sharedList := request(http.MethodGet, "giftcards", "", recipientToken, "", 200)
	if len(sharedList["items"].([]any)) != 2 {
		t.Fatal("wallet grant did not expose all owner cards")
	}
	future := request(http.MethodPost, "giftcards", "", ownerToken, cardBody, 200)
	futureID := future["id"].(string)
	request(http.MethodGet, "giftcards", futureID, recipientToken, "", 200)
	otherBody := strings.Replace(cardBody, owner.Id, stranger.Id, 1)
	other := request(http.MethodPost, "giftcards", "", strangerToken, otherBody, 200)
	request(http.MethodGet, "giftcards", other["id"].(string), recipientToken, "", 404)
	forwardBody := `{"owner":"` + recipient.Id + `","email":"stranger@example.com"}`
	request(http.MethodPost, "giftcard_shares", "", recipientToken, forwardBody, 200)
	request(http.MethodGet, "giftcards", card, strangerToken, "", 404)

	accessList := request(http.MethodGet, "giftcard_shares", "", recipientToken, "", 200)
	if len(accessList["items"].([]any)) != 1 {
		t.Fatal("recipient cannot list just their own wallet sharing")
	}
	ownShare := accessList["items"].([]any)[0].(map[string]any)
	if ownShare["owner"] != recipient.Id {
		t.Fatal("recipient can read another owner's sharing list")
	}
	read := request(http.MethodGet, "giftcards", card, recipientToken, "", 200)
	if _, exists := read["number"]; exists {
		t.Fatal("ordinary API exposed card number")
	}
	if _, exists := read["pin"]; exists {
		t.Fatal("ordinary API exposed PIN")
	}
	if read["hasNumber"] != true || read["hasPin"] != true {
		t.Fatalf("missing secret-presence flags: %#v", read)
	}
	revealPath := "/api/giftcards/" + card + "/reveal"
	request(http.MethodPost, "", revealPath, "", "", 401)
	request(http.MethodPost, "", revealPath, strangerToken, "", 404)
	request(http.MethodPost, "", revealPath, unverifiedToken, "", 404)
	details := request(http.MethodPost, "", revealPath, recipientToken, "", 200)
	if details["number"] != "secret-code" || details["pin"] != "1234" {
		t.Fatal("shared reader cannot retrieve card details")
	}
	stored, err := app.FindRecordById("giftcards", card)
	if err != nil {
		t.Fatal(err)
	}
	numberBefore := stored.GetString("number")
	if !strings.HasPrefix(numberBefore, giftCardCipherPrefix) || strings.Contains(numberBefore, "secret-code") || stored.GetString("pin") == "1234" {
		t.Fatal("database contains plaintext details")
	}
	balancePath := "/api/giftcards/" + card + "/balance-check"
	confirmBody, _ := json.Marshal(map[string]any{"balance": 0, "expectedUpdated": read["updated"]})
	request(http.MethodPost, "", balancePath, "", string(confirmBody), 401)
	request(http.MethodPost, "", balancePath, strangerToken, string(confirmBody), 404)
	request(http.MethodPost, "", balancePath, recipientToken, string(confirmBody), 404)
	for _, invalid := range []string{`{}`, `{"balance":0}`, `{"balance":-1,"expectedUpdated":""}`, `{"balance":1.5,"expectedUpdated":""}`, `{"balance":100000001,"expectedUpdated":""}`} {
		request(http.MethodPost, "", balancePath, ownerToken, invalid, 400)
	}
	request(http.MethodPost, "", balancePath, ownerToken, `{"balance":0,"expectedUpdated":"stale"}`, 409)
	checked := request(http.MethodPost, "", balancePath, ownerToken, string(confirmBody), 200)
	if checked["balance"] != float64(0) {
		t.Fatal("confirmed zero balance was not saved")
	}
	checkedAt, ok := checked["balanceCheckedAt"].(string)
	if !ok || checkedAt == "" {
		t.Fatal("successful confirmation did not record its date")
	}
	stored, _ = app.FindRecordById("giftcards", card)
	if stored.GetString("number") != numberBefore {
		t.Fatal("balance confirmation changed encrypted card details")
	}
	request(http.MethodPost, "", balancePath, ownerToken, `{"balance":1500,"expectedUpdated":"stale"}`, 409)
	stored, _ = app.FindRecordById("giftcards", card)
	if stored.GetInt("balance") != 0 || stored.GetString("balanceCheckedAt") != checkedAt {
		t.Fatal("failed check changed stored balance or date")
	}
	preserved := request(http.MethodPatch, "giftcards", card, ownerToken, `{"notes":"Only a note","balanceCheckedAt":"2099-01-01 00:00:00.000Z"}`, 200)
	if preserved["balanceCheckedAt"] != checkedAt {
		t.Fatal("ordinary update forged or cleared the check date")
	}
	changed := request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":100}`, 200)
	if changed["balanceCheckedAt"] != "" {
		t.Fatal("manual balance edit kept the old check date")
	}
	confirmBody, _ = json.Marshal(map[string]any{"balance": 100, "expectedUpdated": changed["updated"]})
	checked = request(http.MethodPost, "", balancePath, ownerToken, string(confirmBody), 200)
	if checked["balanceCheckedAt"] == "" {
		t.Fatal("confirming unchanged amount did not stamp the check")
	}
	changed = request(http.MethodPatch, "giftcards", card, ownerToken, `{"cardPin":"4321"}`, 200)
	if changed["balanceCheckedAt"] != "" {
		t.Fatal("replacing card details kept the old check date")
	}
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"cardPin":"1234"}`, 200)

	request(http.MethodGet, "giftcards", card, strangerToken, "", 404)
	request(http.MethodPatch, "giftcards", card, recipientToken, `{"balance":0}`, 404)
	request(http.MethodDelete, "giftcards", card, recipientToken, "", 404)
	request(http.MethodPost, "giftcard_shares", "", recipientToken, shareBody, 400)
	request(http.MethodPatch, "giftcard_shares", share["id"].(string), ownerToken, `{"email":"stranger@example.com"}`, 403)
	request(http.MethodDelete, "giftcard_shares", share["id"].(string), strangerToken, "", 404)
	request(http.MethodPost, "giftcard_shares", "", ownerToken, `{"owner":"`+owner.Id+`","email":"`+unverified.Email()+`"}`, 200)
	request(http.MethodGet, "giftcards", card, unverifiedToken, "", 404)
	request(http.MethodDelete, "giftcard_shares", share["id"].(string), ownerToken, "", 204)
	request(http.MethodGet, "giftcards", card, recipientToken, "", 404)
	request(http.MethodPost, "", revealPath, recipientToken, "", 404)
	request(http.MethodGet, "giftcards", privateID, recipientToken, "", 404)
	request(http.MethodGet, "giftcards", futureID, recipientToken, "", 404)
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":0}`, 200)
	stored, _ = app.FindRecordById("giftcards", card)
	if stored.GetString("number") != numberBefore {
		t.Fatal("metadata edit changed encrypted number")
	}
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"cardNumber":"replacement-code"}`, 200)
	details = request(http.MethodPost, "", revealPath, ownerToken, "", 200)
	if details["number"] != "replacement-code" || details["pin"] != "1234" {
		t.Fatal("replacement did not preserve unchanged PIN")
	}
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"cardPin":""}`, 200)
	details = request(http.MethodPost, "", revealPath, ownerToken, "", 200)
	if details["pin"] != "" {
		t.Fatal("PIN was not cleared")
	}
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"cardNumber":"`+strings.Repeat("x", 201)+`"}`, 400)
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":-1}`, 400)
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":1.5}`, 400)
	request(http.MethodPost, "giftcard_shares", "", ownerToken, shareBody, 200)
	request(http.MethodDelete, "giftcards", card, ownerToken, "", 204)
	request(http.MethodGet, "giftcards", futureID, recipientToken, "", 200)
	request(http.MethodPost, "", "/api/giftcards/"+futureID+"/reveal", recipientToken, "", 200)

	grants, err := app.FindAllRecords("giftcard_shares")
	if err != nil {
		t.Fatal(err)
	}
	ownerGrants := 0
	for _, grant := range grants {
		if grant.GetString("owner") == owner.Id {
			ownerGrants++
		}
	}
	if ownerGrants != 2 {
		t.Fatal("deleting one card changed wallet sharing")
	}
}
