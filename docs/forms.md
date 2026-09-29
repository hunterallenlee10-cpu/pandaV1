# Forms

Forms cannot submit on a static copy: there is no server behind it to receive the data. Their markup is kept as
captured; the only change is that URLs pointing at the main site (form `action`s and the AJAX endpoints in page
scripts, e.g. `/wp-admin/admin-ajax.php`) are root-relative like every other link, so a test submission on the
copy goes to the static host (and fails harmlessly) instead of reaching the live site. The original action URL is
listed below. Actions that point at a third-party service were left untouched — **submitting those from the copy
would reach that service for real.**

Unique forms found: **6** (identical forms on several pages are listed once).

## 1. Custom / unknown — `#lead-form`

- **Action:** `https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DHo000002gd1g` ⚠️ third-party endpoint, left live
- **Method:** POST
- **Appears on 138 page(s):** /, /about/, /blog/, /blog/10-questions-to-ask-before-signing-a-roof-replacement-contract/, /blog/15-questions-to-ask-before-you-hire-a-roofer/, /blog/5-benefits-of-hiring-a-professional-for-roof-replacement/, /blog/5-benefits-of-replacing-your-roof-before-the-holidays/, /blog/5-signs-its-time-to-replace-your-roof-before-it-costs-you-more/ … (+130)

| Field name | Type | Label / placeholder | Required |
| --- | --- | --- | --- |
| oid | hidden |  |  |
| retURL | hidden |  |  |
| lead_source | hidden |  |  |
| 00NPs00000PTbNd | hidden |  |  |
| 00NPs00000PTbNh | hidden |  |  |
| first_name | text | First Name | yes |
| last_name | text | Last Name | yes |
| email | email | Email Address | yes |
| phone | tel | Phone Number | yes |
| (none) | text | Address |  |
| city | hidden |  |  |
| state | hidden |  |  |
| zip | hidden |  |  |
| country | hidden |  |  |
| street | hidden |  |  |
| 00NHo00000Xc7bb | select |  | yes |
| (none) | checkbox | I agree to receive automated Customer Care text messages from Panda Exteriors at |  |
| (none) | checkbox | I agree to receive automated Customer Care email messages from Panda Exteriors a |  |
| (none) | submit | Get a Free Roof Inspection |  |

## 2. Custom / unknown — `#lead-form-2`

- **Action:** `https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DHo000002gd1g` ⚠️ third-party endpoint, left live
- **Method:** POST
- **Appears on 123 page(s):** /, /about/, /blog/10-questions-to-ask-before-signing-a-roof-replacement-contract/, /blog/15-questions-to-ask-before-you-hire-a-roofer/, /blog/5-benefits-of-hiring-a-professional-for-roof-replacement/, /blog/5-benefits-of-replacing-your-roof-before-the-holidays/, /blog/5-signs-its-time-to-replace-your-roof-before-it-costs-you-more/, /blog/actual-cash-value-vs-replacement-cost-how-your-roof-insurance-payout-is-calculated/ … (+115)

| Field name | Type | Label / placeholder | Required |
| --- | --- | --- | --- |
| oid | hidden |  |  |
| retURL | hidden |  |  |
| lead_source | hidden |  |  |
| first_name | text | First Name | yes |
| last_name | text | Last Name | yes |
| email | email | Email Address | yes |
| phone | tel | Phone Number | yes |
| (none) | text | Address |  |
| city | hidden |  |  |
| state | hidden |  |  |
| zip | hidden |  |  |
| country | hidden |  |  |
| street | hidden |  |  |
| 00NPs00000PTbNd | hidden |  |  |
| 00NHo00000Xc7bb | select |  | yes |
| (none) | checkbox | By checking this box, I authorize Panda Exteriors to send me marketing calls and | yes |
| (none) | submit | Schedule a Free Estimate |  |

## 3. Custom / unknown — `#lead-form`

- **Action:** `javascript:void(0);` ⚠️ third-party endpoint, left live
- **Method:** GET
- **Appears on 2 page(s):** /careers/, /referral/

| Field name | Type | Label / placeholder | Required |
| --- | --- | --- | --- |
| (none) | submit | Send |  |
| (none) | text |  |  |
| street | text |  |  |
| city | text |  |  |
| state | text |  |  |
| zip | text |  |  |
| country | text |  |  |
| first_name | text |  |  |
| last_name | text |  |  |
| email | email |  |  |
| phone | tel |  |  |
| 00NPs00000PTbNd | hidden |  |  |
| 00NHo00000Xc7bY | select |  |  |
| 00NHo00000Xc7bb | select |  |  |
| 00NHo00000XcFMN | textarea |  |  |

## 4. Contact Form 7

- **Action:** `https://pandaexteriors.com/charity-and-community/#wpcf7-f15583-o1`
- **Method:** POST
- **Appears on 1 page(s):** /charity-and-community/

| Field name | Type | Label / placeholder | Required |
| --- | --- | --- | --- |
| _wpcf7 | hidden |  |  |
| _wpcf7_version | hidden |  |  |
| _wpcf7_locale | hidden |  |  |
| _wpcf7_unit_tag | hidden |  |  |
| _wpcf7_container_post | hidden |  |  |
| _wpcf7_posted_data_hash | hidden |  |  |
| full-name | text | Full Name | yes |
| phone | tel | Phone Number | yes |
| your-email | email | Email Address | yes |
| comments | textarea | Comments |  |
| (none) | checkbox | By checking this box, I authorize Panda Exteriors to send me marketing calls and | yes |
| (none) | submit | Send Message |  |

## 5. Contact Form 7

- **Action:** `https://pandaexteriors.com/contact-us/#wpcf7-f15583-o1`
- **Method:** POST
- **Appears on 1 page(s):** /contact-us/

| Field name | Type | Label / placeholder | Required |
| --- | --- | --- | --- |
| _wpcf7 | hidden |  |  |
| _wpcf7_version | hidden |  |  |
| _wpcf7_locale | hidden |  |  |
| _wpcf7_unit_tag | hidden |  |  |
| _wpcf7_container_post | hidden |  |  |
| _wpcf7_posted_data_hash | hidden |  |  |
| full-name | text | Full Name | yes |
| phone | tel | Phone Number | yes |
| your-email | email | Email Address | yes |
| comments | textarea | Comments |  |
| (none) | checkbox | By checking this box, I authorize Panda Exteriors to send me marketing calls and | yes |
| (none) | submit | Send Message |  |

## 6. Custom / unknown — `#pcv2-referral-form`

- **Action:** `(none — submits to the current page / via JavaScript)`
- **Method:** GET
- **Appears on 1 page(s):** /referral/

| Field name | Type | Label / placeholder | Required |
| --- | --- | --- | --- |
| employeeName | text | Full Name * | yes |
| employeePhone | tel | Phone Number * | yes |
| employeeEmail | email | Email Address * | yes |
| employeeOffice | select | Office Location * | yes |
| candidateName | text | Full Name * | yes |
| candidatePhone | tel | Phone Number * | yes |
| candidateEmail | email | Email Address * | yes |
| notes | textarea | Notes (optional) |  |
| (none) | submit | Submit Referral |  |

## Making forms work on a static host

- **Netlify Forms:** add `data-netlify="true"` (and a `name`) to a `<form>`; Netlify captures submissions.
- **Formspree / Basin / Getform:** point the form `action` at the service endpoint.
- **Cloudflare Pages:** handle the POST with a Pages Function.
