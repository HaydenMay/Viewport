# Private catalog transfer

The owner-only, server-code-protected preview is separate from public GitHub Pages. Public catalog approval remains false.

`Generate encrypted private catalog` uses the existing repository API secrets and the same bounded 300-title ingestion pipeline. It runs manually, or once when `config/private-preview-public.pem` changes on main. Ordinary app edits do not refresh the catalog or spend API quota.

Only normalized records held in memory are encrypted. AES-256-GCM authenticates the payload; RSA-OAEP-SHA256 wraps a random per-export encryption key. Only the public wrapping key is committed. The private decryption key is held privately by the operator, never in the repository, logs or browser. The workflow uploads ciphertext only as a one-day Actions artifact. No plaintext catalog, posters, credentials or decryption key are uploaded. Aggregate reports remain public.

The operator downloads the encrypted artifact, decrypts and validates it in a private workspace, then builds and deploys only to the owner-private preview with all app assets behind the server code gate. The public Pages build continues serving 24 fixture titles. Keep decrypted source records and private preview build output out of the public repository.

For another refresh, generate a new RSA keypair, retain the private key privately for that refresh, and replace the public key file. Its commit triggers the workflow. Retrieve and deploy the result before discarding the private key. A successful workflow means generation succeeded; it does not itself update the private preview. If a key is lost, generate another pair and rerun; do not make the data public to recover it.

Imported launch URLs remain validated candidates rather than newly verified native title launches. Titles without accepted exact-title links do not enter discovery. Unknown ratings remain excluded under a maturity ceiling; selecting No maturity limit allows them. Default providers remain Netflix, Disney+, Hulu and Paramount+, with Prime and Peacock off. API records have genre-only content coverage and original neutral art. Private testing does not resolve the pending public distribution or image licensing questions.
