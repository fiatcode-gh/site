---
title: "Sign GitHub Commit on Windows"
description: "A guide to sign GitHub commit on Windows"
date: 2026-02-18T23:48:00+07:00
draft: false
tags:
  - git
  - windows
---

## Every commit, cryptographically yours.

GitHub shows a green "Verified" badge on commits signed with GPG. On Windows, Git for Windows already ships with `gpg` — you just need to expose it and wire up the config.

First, add `C:\Program Files\Git\usr\bin\` to your PATH.

---

### Generate and Export the Key

Generate a new GPG key:

```bash
gpg --full-generate-key
```

List it to get the key ID:

```bash
gpg --list-secret-keys --keyid-format=long
```

```plaintext
Output:
[keyboxd]
---------
sec   ed25519/C50213C2685D0XXX 2025-04-30 [SC] [expires: 2030-04-29]
      9D01A4041614F5DF7C9A1EC9C50213C2685D0XXX
uid                 [ultimate] Your Name <you@mail.com>
ssb   cv25519/B962022817E5DXXX 2025-04-30 [E] [expires: 2030-04-29]
```

Export the public key:

```bash
gpg --armor --export C50213C2685D0XXX
```

Copy the output and add it to your GitHub account under **Settings > SSH and GPG keys**.

---

### Configure Git

```plaintext
git config --global user.signingkey C50213C2685D0XXX
git config --global tag.gpgSign true
git config --global commit.gpgsign true
git config --global gpg.program "C:\\Program Files\\Git\\usr\\bin\\gpg.exe"
```

Setting `gpg.program` explicitly is important — if you have another `gpg` installed elsewhere on your PATH, Git will find the wrong one.
