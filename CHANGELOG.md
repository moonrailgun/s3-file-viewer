# Changelog

## [1.1.0](https://github.com/moonrailgun/s3-file-viewer/compare/v1.0.0...v1.1.0) (2025-10-30)

### Features

* add audio preview feature which make everything easy ([ad91d68](https://github.com/moonrailgun/s3-file-viewer/commit/ad91d68d9f2e9db641f6ace7ee7eeec3058c9715))
* add bucket detail modal ([95fbdb6](https://github.com/moonrailgun/s3-file-viewer/commit/95fbdb684fde49d434aff27db9a83e69f5e1fab7))
* add create bucket feature ([e758429](https://github.com/moonrailgun/s3-file-viewer/commit/e758429f45ef247f19fc9ce6f90d316c8051f2fe))
* add current bucket name in main area ([76ff022](https://github.com/moonrailgun/s3-file-viewer/commit/76ff0227e51106c4a5af296dbb33d7bf0ccd4161))
* add download feature ([43d2c6a](https://github.com/moonrailgun/s3-file-viewer/commit/43d2c6a79d6c5cc165c88d318c0a6738fcb0849d))
* add drag and drop upload fetch ([21c142e](https://github.com/moonrailgun/s3-file-viewer/commit/21c142ed2da38f158846f86e7cff10466b7bf3cd))
* add file sidebar which can inspect file info ([906ea2a](https://github.com/moonrailgun/s3-file-viewer/commit/906ea2afe5bbf0a61816dfc668897d58886754a2))
* add loading feature for preview ([1de542c](https://github.com/moonrailgun/s3-file-viewer/commit/1de542c9131e4ad6226e7ca09b90c9c93fccc211))
* add mobile layout support ([b07091e](https://github.com/moonrailgun/s3-file-viewer/commit/b07091e75a393ab1a6fc0665a56e3a482db9c163))
* add search file feature ([030c588](https://github.com/moonrailgun/s3-file-viewer/commit/030c58881667f65a38e24f09656dffcea9915c28))
* add video preview for file details ([7b50973](https://github.com/moonrailgun/s3-file-viewer/commit/7b50973045bebc3b5696f965c860cce30e4a5953))
* implement global hotkeys for search, refresh, and upload actions in CompactToolbar ([908494a](https://github.com/moonrailgun/s3-file-viewer/commit/908494a813c559a433953e8b20d23749a7ea16e4))
* implement keyboard navigation and auto-scroll for file selection in grid and list views ([cc77c8c](https://github.com/moonrailgun/s3-file-viewer/commit/cc77c8c8e2746ad4878df6d24c9dad00f6bb7f35))
* improve breadcrumbs display ([f61baf8](https://github.com/moonrailgun/s3-file-viewer/commit/f61baf88a3a9957a3ff7b3ba9a5fa7e60b9151db))
* improve connection sidebar style and add region badge ([4ed215a](https://github.com/moonrailgun/s3-file-viewer/commit/4ed215adbca83c2e5a5436bd5ad93e016ffcfad1))
* improve date formatting for last modified timestamps ([792fee4](https://github.com/moonrailgun/s3-file-viewer/commit/792fee4159575b54e258ce5811cf06ae6d94ea73))

### Bug Fixes

* fix a bug which will loop fetch on load error ([7ed1048](https://github.com/moonrailgun/s3-file-viewer/commit/7ed1048fd2cbcaef988bce90b36b9a1696a30299))

### Others

* add virtualization capabilities to optimize performance ([1f5e27a](https://github.com/moonrailgun/s3-file-viewer/commit/1f5e27a33d4cacceaba943df33850a584e0c1bef))
* refactor total app which make sure code not tool long ([84a2ffb](https://github.com/moonrailgun/s3-file-viewer/commit/84a2ffb1212f8a0ca0d8aae26383afa5a7df0d49))
* resolve warning ([90eff8b](https://github.com/moonrailgun/s3-file-viewer/commit/90eff8b35628c9cb6de48bc633788468bf93ccf9))

## [1.0.0](https://github.com/moonrailgun/s3-file-viewer/compare/v0.2.0...v1.0.0) (2025-10-24)

### Features

* add connection editing feature ([78d3e9b](https://github.com/moonrailgun/s3-file-viewer/commit/78d3e9b11383ecb1729ce72e3eba14fd0a76bb2e))
* clear objects list when switching buckets in S3 browser ([a75e341](https://github.com/moonrailgun/s3-file-viewer/commit/a75e34193005d0b8e79e04b8449ac62fbde24538))
* enhance context menu functionality and add modals for folder creation and connection deletion ([bd0ca75](https://github.com/moonrailgun/s3-file-viewer/commit/bd0ca759dfbc73f910f94cffd03bc53b1c251e84))
* implement context menu for connection items and auto-collapse inactive connections ([9eafcd7](https://github.com/moonrailgun/s3-file-viewer/commit/9eafcd73df4cb7ee811f5d4633d2e65af307c380))

### Document

* add Vercel configuration and update documentation with download link and favicon ([93d794e](https://github.com/moonrailgun/s3-file-viewer/commit/93d794e7e32e8b8b0f378a0e6afb3d2f704b046f))
* add website ([01d8fca](https://github.com/moonrailgun/s3-file-viewer/commit/01d8fca2443803250f09d28234c6799e8edb615f))

### Others

* intergate tailwindcss ([a3420e3](https://github.com/moonrailgun/s3-file-viewer/commit/a3420e30db10d0cf1827fe23f6096b61b62a6155))
* redesign main page layout which should be more better for switch ([bc215e9](https://github.com/moonrailgun/s3-file-viewer/commit/bc215e96478b80e6b6fc429931f761fbc06b8f91))

## [0.2.0](https://github.com/moonrailgun/s3-file-viewer/compare/v0.1.6...v0.2.0) (2025-10-10)

### Features

* add create folder feature ([0e248fe](https://github.com/moonrailgun/s3-file-viewer/commit/0e248fe7f7f70cf3e337275cf614eceba10e82e6))
* add delete confirm modal which can improve delete action ([e13aabf](https://github.com/moonrailgun/s3-file-viewer/commit/e13aabf63743b384581f792245a8431555290563))
* add edit way in ConnectForm ([6cfb4f6](https://github.com/moonrailgun/s3-file-viewer/commit/6cfb4f663ba41eceae1f38ff7096c29d2ffa7b6c))
* add MIME type inference and improve notification positioning ([8f7f84c](https://github.com/moonrailgun/s3-file-viewer/commit/8f7f84cdc1db57d5b23e9cdac85b680357429e48))
* add more detail for s3 error ([2f4e48b](https://github.com/moonrailgun/s3-file-viewer/commit/2f4e48b7945ee12336728c0c60673dfdb7c33770))
* add upload progress feature ([55f4394](https://github.com/moonrailgun/s3-file-viewer/commit/55f43943c643598fd183e0a06c631c3921725b39))

### Document

* update README ([e0d5e1e](https://github.com/moonrailgun/s3-file-viewer/commit/e0d5e1e09cc356d548e627fdc4fcc4e64353783a))

### Others

* only successed connect will add to save connections ([6dad2f2](https://github.com/moonrailgun/s3-file-viewer/commit/6dad2f2513ed61de8bba4a5c42fff7d27ea06128))
* update text of connect form ([0d0be66](https://github.com/moonrailgun/s3-file-viewer/commit/0d0be66caeb41ae0674371030629e6681f4ee450))

## [0.1.6](https://github.com/moonrailgun/s3-file-viewer/compare/v0.1.5...v0.1.6) (2025-09-05)

### Others

* update release body in GitHub Actions workflow to include detailed download instructions for Windows, macOS, and Linux ([61408a4](https://github.com/moonrailgun/s3-file-viewer/commit/61408a4c4905e057be98365aedaa616e66935bb3))

## [0.1.5](https://github.com/moonrailgun/s3-file-viewer/compare/v0.1.4...v0.1.5) (2025-09-04)

### Others

* add before:bump hook to update version in tauri.conf.json ([2f9014b](https://github.com/moonrailgun/s3-file-viewer/commit/2f9014bd09afe7b34c9447a4e3200236477fb43b))
* update release name format and set releaseDraft to false in GitHub Actions workflow ([d0c1c72](https://github.com/moonrailgun/s3-file-viewer/commit/d0c1c72b741a672e37588650e8118f7287030ae4))

## [0.1.4](https://github.com/moonrailgun/s3-file-viewer/compare/v0.1.3...v0.1.4) (2025-09-04)

### Others

* disable GitHub release in release-it configuration ([ae00581](https://github.com/moonrailgun/s3-file-viewer/commit/ae00581eb809d10ffb4247f534d1ce30579313ef))

## [0.1.3](https://github.com/moonrailgun/s3-file-viewer/compare/v0.1.2...v0.1.3) (2025-09-04)

### Others

* add Bun setup step to GitHub Actions workflow ([7727022](https://github.com/moonrailgun/s3-file-viewer/commit/7727022a24381fe51d799d10211153ad969eebc2))

## [0.1.2](https://github.com/moonrailgun/s3-file-viewer/compare/v0.1.1...v0.1.2) (2025-09-03)

## 0.1.1 (2025-09-03)

### Features

* add bucket selection handler to reset prefix in S3 file viewer ([e655e23](https://github.com/moonrailgun/s3-file-viewer/commit/e655e2369990f259e6e2a05361002ad99eacbe6a))
* add main UI and main logic which have basic implemented ([bd36a6b](https://github.com/moonrailgun/s3-file-viewer/commit/bd36a6bc564393000b86058410a452d462c7b443))
* add saved connections management and disconnect functionality ([021e86e](https://github.com/moonrailgun/s3-file-viewer/commit/021e86e2ca2cd6a8d98a3f8b9c1c7edf0a17117a))
* enhance object list interaction with double-click preview and user select styles ([0f5c13d](https://github.com/moonrailgun/s3-file-viewer/commit/0f5c13da85f095fd635a863ad53463d0e2cd602d))
* integrate clipboard manager plugin and enhance file viewer functionality ([ef5fb54](https://github.com/moonrailgun/s3-file-viewer/commit/ef5fb542d4738ac58b5eab2df926d0701b6649e8))
* refactor S3 file viewer with modular components and improved state management ([887ea7d](https://github.com/moonrailgun/s3-file-viewer/commit/887ea7d7a9906e1d5f050a19dd33ee42aadff9b3))

### Bug Fixes

* update alignment of object thumbnails in the file viewer ([25543b8](https://github.com/moonrailgun/s3-file-viewer/commit/25543b8ccf303dcea9da425a9b520706f78fdf25))

### Others

* add release-it configuration and GitHub Actions for automated releases ([5a5f3cc](https://github.com/moonrailgun/s3-file-viewer/commit/5a5f3cc5706f6c75bc5a984914ceb401f7446d11))
* init ([a46819c](https://github.com/moonrailgun/s3-file-viewer/commit/a46819c21729205b19d82f9c954f000eab51dba1))
* move repo path ([b7aba8d](https://github.com/moonrailgun/s3-file-viewer/commit/b7aba8d991c9f557d75a3d27a76e4fcb478e3673))
* remove unused App.css file and update App.tsx to reflect changes ([4c8c864](https://github.com/moonrailgun/s3-file-viewer/commit/4c8c864e749b2415b10b0bb063e69deb69347ba8))
* style and dark mode support ([13aff3f](https://github.com/moonrailgun/s3-file-viewer/commit/13aff3f13178951a0a777604630e570126c4184c))
* update icons ([58662d3](https://github.com/moonrailgun/s3-file-viewer/commit/58662d3fd3d0122ffdff51b1a0922049616076de))
