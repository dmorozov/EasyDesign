# Headless primitives: React Aria Components (not Radix / shadcn)

The palette's Components are built on **React Aria Components** (Adobe, Apache-2.0), deliberately
_not_ the popular Radix Primitives / shadcn-ui default that this project originally assumed.

**Why deviate from the obvious choice.** React Aria offers the widest accessible widget breadth
(Table, Tree, DatePicker, ColorPicker, Slider) — directly populating the palette — and the
strongest accessibility, which matters precisely because EasyDesign's users are non-designers who
won't add ARIA themselves. **Radix Primitives was rejected for bus-factor risk** (effectively one
maintainer, ~400-item backlog), inappropriate as a new product's foundation. **Base UI** (MUI, MIT)
was the runner-up — better `asChild` wrapping ergonomics but a narrower widget set; choose it only
if wrapping ergonomics ever outweigh breadth.

Apache-2.0 obligation: reproduce `NOTICE.txt` in the distributed third-party credits (a doc, not
in-app UI).
