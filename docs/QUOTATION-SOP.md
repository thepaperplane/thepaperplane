# Quotation cycle — standard operating procedure

**One rule runs through everything:** an automated quotation shows _starting prices only_.
Nothing becomes a fixed amount — and nothing can be accepted — until a person on the team
approves a **final quotation**. The system enforces this; the steps below are how the team
works inside it.

## The two kinds of quotation

|               | Automated quotation (estimate)                                | Final quotation                            |
| ------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Made by       | The system, from what the client chose                        | The team, after confirming scope and price |
| Prices        | Every figure reads "from ₹…"; suggestions show a range        | Fixed amounts, no "from"                   |
| Labelled      | "Automated quotation · starting prices" (screen, PDF, emails) | "Final quotation", with approval date      |
| Client can    | Read, add suggestions, ask for the final, message, decline    | Read, accept, add-on requests, message     |
| Client cannot | Accept it                                                     | —                                          |

## The cycle

```
Request ─▶ Screen ─▶ Automated quotation ─▶ Client asks for final ─▶ Team approves ─▶ Final quotation ─▶ Accepted ─▶ Work, add-ons, invoice
           (auto /     (starting prices)      (button on the page)     (console)        (fixed amounts)    (client)
            held)
```

| #   | Stage                       | Who    | What happens                                                                                                                                                                                                                 | Target                                  |
| --- | --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | **Request**                 | Client | Chooses services on `/get-quote`, or a team member builds one in the console. Only a name is needed to make a console link; the website form needs an email so the quotation has somewhere to go.                            | —                                       |
| 2   | **Wait for approval**       | System | Every request from `/get-quote` or WhatsApp is saved as _Awaiting approval_. **Nothing is sent automatically.** The score and screening note (disposable email, blocked term, repeat requests) are shown to help you decide. | instant                                 |
| 3   | **Review, edit, send**      | Team   | Console → Quotations → _Awaiting approval_ → open it → **Edit** services/prices if needed → **Send to the client** (or **Make the link live** and share it yourself).                                                        | same working day                        |
| 4   | **Automated quotation**     | System | Emails a private link. The email never contains a price.                                                                                                                                                                     | instant                                 |
| 5   | **Client reads / adds**     | Client | May tick _People who ask for this often add_. Each shows a starting price range and is marked _awaiting approval_ — it is **not** priced.                                                                                    | —                                       |
| 6   | **Ask for the final**       | Client | Presses **Request my final quotation**. Status becomes _final requested_; the client gets an acknowledgement; the team is emailed.                                                                                           | —                                       |
| 7   | **Confirm scope and price** | Team   | Call the client (or WhatsApp). Agree scope, options, quantities, discount and any added services.                                                                                                                            | within **1 working day** of the request |
| 8   | **Edit**                    | Team   | Console → the quotation → **Edit**. Set the real amount on every line, including anything the client added. Government fees stay separate, at actual cost.                                                                   | —                                       |
| 9   | **Approve**                 | Team   | On the quotation: tick the three checks, then **Approve and issue the final quotation**. Amounts freeze, "from" wording goes, validity restarts, the approver and time are recorded. Optionally send it right away.          | —                                       |
| 10  | **Accept**                  | Client | Reads the final and presses **Accept this quotation** (or the team records a phone agreement).                                                                                                                               | validity: 14 days by default            |
| 11  | **Onboard**                 | System | Client record and onboarding created; the documents checklist is sent with the fee and UPI details.                                                                                                                          | instant                                 |
| 12  | **Add-ons**                 | Both   | Anything beyond scope is _priced first_, approved by the client, and carried onto the invoice with its date.                                                                                                                 | before any extra work starts            |
| 13  | **Invoice**                 | Team   | Console → the quotation → **Create the invoice** (original quotation + every approved add-on).                                                                                                                               | on acceptance                           |

### Suggestions ("People who ask for this often add")

- On an **automated** quotation the client sees a _starting price range_ (for example
  "₹5,000 – ₹15,000") and the line joins the quotation marked _awaiting approval_. The real
  amount appears only in the final quotation.
- On a **final or accepted** quotation the suggestion does not change the quotation. It becomes
  an **add-on request with no price**. The team prices it (Quotation → Add-ons → _Price and ask_),
  the client approves that price, and only then does it count.
- In both cases the team is emailed, and the step is written to the paper trail.

## Rules the team follows

1. **Never promise a figure from the automated quotation.** Say "starting from".
2. **Never send a final quotation you have not approved in the console.** Approval is what
   records who agreed the amounts.
3. **A price you change after the client has seen the final is a revision.** Use _Approve a
   revised final quotation_; the revision number goes up and the client's clock restarts.
4. **Links are private.** A link is shown only in the console and in what we send to that client.
   It is never on a public page, in the sitemap, in analytics or in a search result. If a link is
   shared further than it should be (the console warns when it is opened from 4+ addresses),
   press **Renew the link**: the old one stops at once.
5. **No email or phone? No problem.** Console → New quotation → give a name → **Save and make the
   link live**, then use _Share on WhatsApp_ or _Copy a ready message_.
6. **Everything leaves a trail.** The _Paper trail_ panel on each quotation lists every request,
   release, approval, send, view and acceptance with who and when.

## Service levels

| Event                                           | Reply by                                         |
| ----------------------------------------------- | ------------------------------------------------ |
| Request awaiting approval                       | End of the same working day                      |
| Final quotation requested                       | 1 working day                                    |
| Client message on a quotation                   | 1 working day                                    |
| Add-on requested                                | Price back to the client within 1 working day    |
| Final quotation about to expire, client engaged | Extend (Renew the link) rather than let it lapse |

## Where things live

- **Console → Quotations** — the work queue. _Final requested_ is the most urgent tab.
- **Console → Pricing** — starting prices. A price typed there flows into every quotation and
  every note that mentions it (for example the Care Plan under a website) — nothing to retype.
- **Client page** — `/q/<private token>`: _Download as PDF_ produces an A4 copy; automated
  quotations are watermarked and labelled so they cannot be mistaken for a final.
- **Automations** — follow-up nudges go to clients who have not opened or answered. They never
  contain prices.

## Communication timeline

Every quotation has a **Communication timeline** in the console: the request as the client
made it, every edit by the team, each email or WhatsApp sent (and any that failed), the client
opening the link, their messages in full, add-on requests and decisions, reminders, approvals
and acceptance — with who did it and when. If it is not on the timeline, it did not happen
through the system; log phone calls by adding a note to the quotation.
