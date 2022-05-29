# 以 patch 文件方式更新本地仓库

Git 可以把一个或多个 commit 生成 path 文件，然后 apply 到另外的仓库。

```bash
# 把本地仓库的最后一个 commit 的变动生成 patch 文件
git format-patch HEAD^

# 把本地仓库从最后一个 commit 至某个 commit 的变动生成 patch 文件
git format-patch <commit_id>

# 检查 patch 文件是否可以应用至当前工作区
git apply --check -vvv <patch_file>

# 应用 patch 文件至当前工作区
git apply -vvv <patch_file>

# 应用 patch 文件并直接提交 commit
git am <patch_file>
```