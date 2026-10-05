# Provider deep-link validation

Current Big 6 iOS status is maintained in [provider compatibility](provider-compatibility.md), using the user's explicit native Netflix/Disney+/Hulu success and Prime web-exact result as ground truth. Paramount+ and Peacock are ready candidates with physical testing pending. Max is outside V1.

The current test is the deployed web prototype on iPhone/iPad, following [the short checklist](provider-launch-research.md). Record expected title/year/edition, exact URL, provider, device/OS/app version, region, logged-in/profile state, app versus browser, and final title versus Home/error. A successful open callback alone does not establish the correct landing. Do not collect credentials or buy subscriptions to run tests.

`nativeExact` provider-level reports and individual route/device coverage are separate. Movie, series, and login continuation may behave differently. Promote only actual observed route/platform combinations. An HTTPS title page establishes web identity, not provider association or native support.

## Deferred Apple TV question

No native tvOS work is included or begun in this milestone. Apple TV exact-title routing remains untested for all Big 6 providers. A later native milestone must validate it on physical hardware before promising support, with unsupported routes excluded on that platform. [The earlier native-probe proposal](native-probe.md) is deferred until the current iPhone/iPad results are returned.
