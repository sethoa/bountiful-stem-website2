# RoboPath

An interactive prototype of RoboPath, built from the wireframe board (screens 00–11, M1–M3) and `robopath-all-modules.json`.

## Run it

The app loads its content from `data/*.json`, so it needs a local web server (browsers block these files when you open `index.html` straight from disk):

```
cd robopath
python3 -m http.server 8000
# open http://localhost:8000
```

### In VS Code

Open the `robopath` folder in VS Code (File > Open Folder). Install the recommended **Live Server** extension when prompted, then right-click `index.html` and choose **Open with Live Server**. The wireframes the app was built from are in `docs/wireframes/`.

## Demo accounts

| Role | Email | What to try |
|---|---|---|
| Student | maya.chen@students.lincolnms.org | Continue Variables at step 3, run the robot, take the quiz, reflect |
| Student | kofi.mensah@students.lincolnms.org | Flagged for support (quiz average and failed tries) |
| Teacher | d.okafor@lincolnms.org | Class dashboard, student detail, assign pathways, preview |
| Admin | s.patel@lincolnms.org | Users & roles, publish courses, system report, reset demo data |
| Refused | dana.home@gmail.com | Shows the sign-in refused message |
| Turned off | owen.brooks@students.lincolnms.org | Account turned off by the admin |

## Files

```
index.html            page shell, loads the CSS and JS below
css/tokens.css        colours, type, light and dark themes
css/layout.css        header, side nav, phone tab row, sign-in layout
css/components.css    buttons, cards, tiles, forms, tables, dialogs, toasts
css/screens.css       per-screen styles (01–11, END, requirements map)
css/robot.css         robot grid activity (04, M2)
js/util.js            helpers, icons, seeded random
js/ui.js              toasts, live region, dialog with focus trap
js/content.js         loads data/*.json, renders lesson markdown
js/store.js           learning store + analytics event log (localStorage), demo seeding
js/analytics.js       progress, badges, dashboard numbers, support rules, suggestions
js/robot.js           6x6 grid engine: expand, simulate, animate
js/activities.js      grid, ordering and matching activities; quick check quiz
js/auth.js            01 sign in
js/student.js         02 home, pathways, 03–05b module, END, 06 my progress
js/teacher.js         07 dashboard, 08 student detail, 09 assign, preview
js/admin.js           10 users & roles, 11 courses & system report
js/requirements.js    in-app requirements map
js/app.js             routing, role navigation, boot
data/modules.json     module content (supplied)
data/pathways.json    pathways, step names, badges
data/activities.json  activity set-ups per module
data/school.json      school, classes, roster, assignments, demo seed
data/requirements.json requirements map (source for REQUIREMENTS.md)
REQUIREMENTS.md       written requirements, processes and traceability
```
