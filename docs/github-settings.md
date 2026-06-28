# GitHub リポジトリ設定手順

別リポジトリに同じ設定を適用する際の手順書。
コマンドの `OWNER/REPO` は対象リポジトリに置き換えること。

## 前提

- `gh` CLI がインストール済みで認証済みであること
- リポジトリが **public** であること(OpenSSF Scorecard バッジの要件)

---

## 1. リポジトリ基本設定

```bash
gh api repos/OWNER/REPO --method PATCH --input - << 'EOF'
{
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": false,
  "allow_update_branch": false,
  "delete_branch_on_merge": false
}
EOF
```

| 設定 | 値 | 理由 |
|---|---|---|
| squash merge のみ | `allow_squash_merge: true` 他は `false` | 履歴をクリーンに保つ |
| Update branch ボタン非表示 | `allow_update_branch: false` | base branch との同期を強制しない |

---

## 2. Branch Rulesets

3つの Ruleset を作成する。

### 2-1. ci-and-safety(bypass なし)

CI パスを必須とし、force push とブランチ削除を禁止する。

```bash
gh api repos/OWNER/REPO/rulesets --method POST --input - << 'EOF'
{
  "name": "ci-and-safety",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          { "context": "ci" }
        ],
        "strict_required_status_checks_policy": false
      }
    }
  ]
}
EOF
```

> `context` は CI ワークフローの job 名に合わせること。

### 2-2. review-required(admin は bypass 可)

レビュー 1 名を必須とする。リポジトリ管理者はレビューなしでマージ可能。

```bash
gh api repos/OWNER/REPO/rulesets --method POST --input - << 'EOF'
{
  "name": "review-required",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ],
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    }
  ]
}
EOF
```

> `actor_id: 5` = admin ロール。組織リポジトリの場合は `actor_type: "OrganizationAdmin"` も検討。

### 2-3. squash-only(bypass なし)

squash merge のみ許可する。

```bash
gh api repos/OWNER/REPO/rulesets --method POST --input - << 'EOF'
{
  "name": "squash-only",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    }
  ]
}
EOF
```

---

## 3. Dependabot

`.github/dependabot.yml` をリポジトリに追加する。

```yaml
version: 2

updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
```

`package-ecosystem` はプロジェクトに合わせて変更すること(`npm` / `pip` / `cargo` 等)。

---

## 4. OpenSSF Scorecard

`.github/workflows/scorecard.yml` をリポジトリに追加し、action を pinact で hash 固定する。

```bash
pinact run .github/workflows/scorecard.yml
```

ワークフローの雛形は `tab-mama` リポジトリの `.github/workflows/scorecard.yml` を参照。

---

## 5. 設定の確認

```bash
# Rulesets の一覧
gh api repos/OWNER/REPO/rulesets --jq '.[] | {id, name, enforcement}'

# リポジトリ設定の確認
gh api repos/OWNER/REPO --jq '{
  allow_squash_merge,
  allow_merge_commit,
  allow_rebase_merge,
  allow_update_branch
}'
```
