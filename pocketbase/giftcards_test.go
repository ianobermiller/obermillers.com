package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os/exec"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// Exercise the actual JS schema through PocketBase's HTTP handlers and a temporary
// database. No listening server or shared development data is involved.
func TestGiftCardAccess(t *testing.T) {
	app, err := tests.NewTestApp(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()
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
	_, recipientToken := newUser("recipient@example.com", true)
	unverified, unverifiedToken := newUser("unverified@example.com", false)
	router, err := apis.NewRouter(app)
	if err != nil {
		t.Fatal(err)
	}
	handler, err := router.BuildMux()
	if err != nil {
		t.Fatal(err)
	}
	request := func(method, collection, id, token, body string, status int) map[string]any {
		t.Helper()
		path := "/api/collections/" + collection + "/records"
		if id != "" {
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
		result := map[string]any{}
		_ = json.Unmarshal(res.Body.Bytes(), &result)
		return result
	}
	cardBody := `{"owner":"` + owner.Id + `","merchant":"Coffee","balance":2500,"currency":"USD","number":"secret-code","pin":"1234"}`
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
	shareBody := `{"card":"` + card + `","email":"recipient@example.com"}`
	request(http.MethodPost, "giftcard_access", "", strangerToken, shareBody, 400)
	share := request(http.MethodPost, "giftcard_access", "", ownerToken, shareBody, 200)
	request(http.MethodGet, "giftcards", privateID, recipientToken, "", 404)
	sharedList := request(http.MethodGet, "giftcards", "", recipientToken, "", 200)
	if len(sharedList["items"].([]any)) != 1 {
		t.Fatal("shared list includes unrelated private cards")
	}
	accessList := request(http.MethodGet, "giftcard_access", "", recipientToken, "", 200)
	if len(accessList["items"].([]any)) != 0 {
		t.Fatal("reader can enumerate sharing emails")
	}
	read := request(http.MethodGet, "giftcards", card, recipientToken, "", 200)
	if read["number"] != "secret-code" {
		t.Fatal("shared reader cannot retrieve card code")
	}
	request(http.MethodGet, "giftcards", card, strangerToken, "", 404)
	request(http.MethodPatch, "giftcards", card, recipientToken, `{"balance":0}`, 404)
	request(http.MethodDelete, "giftcards", card, recipientToken, "", 404)
	request(http.MethodPost, "giftcard_access", "", recipientToken, shareBody, 400)
	request(http.MethodPatch, "giftcard_access", share["id"].(string), ownerToken, `{"email":"stranger@example.com"}`, 403)
	request(http.MethodDelete, "giftcard_access", share["id"].(string), strangerToken, "", 404)
	request(http.MethodPost, "giftcard_access", "", ownerToken, `{"card":"`+card+`","email":"`+unverified.Email()+`"}`, 200)
	request(http.MethodGet, "giftcards", card, unverifiedToken, "", 404)
	request(http.MethodDelete, "giftcard_access", share["id"].(string), ownerToken, "", 204)
	request(http.MethodGet, "giftcards", card, recipientToken, "", 404)
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":0}`, 200)
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":-1}`, 400)
	request(http.MethodPatch, "giftcards", card, ownerToken, `{"balance":1.5}`, 400)
	request(http.MethodDelete, "giftcards", card, ownerToken, "", 204)
	grants, err := app.FindAllRecords("giftcard_access")
	if err != nil {
		t.Fatal(err)
	}
	if len(grants) != 0 {
		t.Fatal("deleting card left shared access records")
	}
}
