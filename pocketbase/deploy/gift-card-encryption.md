# Deploy gift card encryption

Gift card numbers and PINs use AES-256-GCM encryption in the custom PocketBase Go server. The database stores ciphertext. Normal collection responses omit these fields. The authenticated `POST /api/giftcards/{id}/reveal` endpoint checks the card's current view rule before decrypting its details.

Merchant names, balances, expiration dates, notes, and sharing email addresses remain unencrypted. Keep redeemable codes out of notes. Anyone who controls the running server can access the key and decrypt the cards.

## Provision the production key

1. Run the key helper on the PocketBase host before starting the new binary:

	```sh
	sudo bash deploy/ensure-gift-card-key.sh
	```

	The helper creates `/etc/pocketbase/gift-card.key` with a random, base64-encoded 32-byte key. The file belongs to `pocketbase` and has mode `0600`. Repeating the command preserves its contents. The existing GitHub deployment and `deploy/setup.sh` run this helper automatically.

2. Save a recovery copy in your encrypted password manager before storing real cards. Store it separately from database backups. Keep the original key for as long as you retain backups encrypted with it.

3. Deploy the custom Go binary and start PocketBase. Its startup checks require the key file. An invalid, missing, or publicly readable key file stops startup. An incorrect key also stops startup when encrypted cards already exist.

4. Apply the collection schema from the repository root, then deploy the frontend:

	```sh
	npm run pb:setup:prod
	```

	Use the existing server-side admin environment for this command. The browser never receives the encryption key.

The server reads `/etc/pocketbase/gift-card.key` by default. To use another file, set the server-only `GIFT_CARD_KEY_FILE` environment variable to its path. Never put the key in Git, a `VITE_` variable, the database, or a database backup.

## Restore encrypted data

1. Stop PocketBase.
2. Restore the key file from your password manager and the database from a matching backup. Set the key's owner to the PocketBase service user and its permissions to `0600`.
3. Start PocketBase and verify that an authorized account can reveal a saved card.

Do not replace the key to fix a startup error. Losing the key makes saved numbers and PINs unrecoverable. Replacing it without re-encrypting the records makes those records unreadable. Key rotation needs an explicit decrypt-and-re-encrypt operation; overwriting the key file is not rotation.

## Upgrade existing plaintext cards

On startup, the server hides the old secret fields and encrypts existing plaintext numbers and PINs in a database transaction. It authenticates existing ciphertext and refuses to start if the key cannot decrypt it. Repeating startup preserves the existing ciphertext.

Old backups, database journals, and freed database pages may still contain earlier plaintext. Treat those copies as sensitive. This migration does not erase historical plaintext copies.

## Run locally

The normal `npm run dev` setup creates an ignored `pocketbase/.secrets/gift-card.key` with owner-only permissions and passes its path to the local PocketBase process. It preserves the key across restarts. The file is outside `pb_data`, so copying the database directory does not copy the key.

Worktrees use the shared PocketBase instance on port 8090. Restart that instance with the updated binary and key configuration before using the encrypted tracker. Do not start a second PocketBase from a worktree.

## Verify changes

From the repository root, run:

```sh
go -C pocketbase test ./...
npm run check
npm run build
```

The Go tests use temporary databases and keys. They exercise the actual collection schema and HTTP handlers, encrypted persistence, authorized reveals, revocation, secret replacement and removal, legacy migration, key-file permissions, and tampering rejection.
