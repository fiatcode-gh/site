---
title: "Sign GitHub Commit on Windows"
description: "A guide to sign GitHub commit on Windows"
date: 2026-02-18T23:48:00+07:00
draft: false
tags:
  - git
  - windows
---

# What's needed

[Git for Windows](https://git-scm.com/install/windows) already shipped with `gpg`. You only need to add `C:\Program Files\Git\usr\bin\` to PATH.

# How-to

- generate gpg key: `gpg --full-generate-key`
- show generated key: `gpg --list-secret-keys --keyid-format=long`

```plaintext
Output:
[keyboxd]
---------
sec   ed25519/C50213C2685D0XXX 2025-04-30 [SC] [expires: 2030-04-29]
      9D01A4041614F5DF7C9A1EC9C50213C2685D0XXX
uid                 [ultimate] Dhemas Nurjaya <dhemasnurjaya@gmail.com>
ssb   cv25519/B962022817E5DXXX 2025-04-30 [E] [expires: 2030-04-29]
```

- export the key to register it to Github account: `gpg --armor --export C50213C2685D0XXX`
- copy the output and add it to Github GPG key in the setting page
- tell git to sign all commits and tags

```plaintext
git config --global user.signingkey C50213C2685D0XXX
git config --global tag.gpgSign true
git config --global commit.gpgsign true
git config --global gpg.program "C:\\Program Files\\Git\\usr\\bin\\gpg.exe"
```

# Important

don't forget to set `gpg.program` to configure `gpg` executable in global git config just in case you already have another `gpg` installed somewhere else.
