## The plan was: lentil soup. The reality: gyros.

It happened on a Tuesday. The lentil soup you'd prepped for lunch sat on the kitchen counter at home, exactly where you forgot it. By 1 pm you were standing at the gyros place around the corner, ordering a large with extra tzatziki and not regretting it.

Now what?

In most meal planning apps, the answer is: nothing. The plan keeps showing Tuesday lentil soup like nothing happened. The shopping list still tells you to buy the spinach for Wednesday's salad even though Wednesday's salad now needs reshuffling. The whole structure quietly drifts out of alignment with reality, and within a week or two you've stopped opening the app.

The plan can't survive a single deviation. So you abandon the plan.

## Plans that flex

Kalmio's job is to absorb that gyros without flinching.

When you tell us "I had something else," we don't punish or guilt-trip. We re-evaluate the rest of your week — the meals you haven't eaten yet, the prep you haven't started, the ingredients still in your fridge — and we present a small narrative diff:

> *"Wednesday's lasagna moves to Friday. Saturday's salmon shifts to Wednesday. You don't need to buy spinach this week — about 600 Ft saved."*

Three actions: Accept, Decline, See details. One tap, the plan re-aligns with reality, and you're back on track. The Tuesday soup goes into the fridge for tomorrow's lunch, the spinach disappears from your shopping list, and Friday's plan adjusts so you actually eat the lasagna instead of forgetting about it.

## Why we built it as a "git diff"

Software developers know this pattern: a "diff" shows you exactly what would change between two versions of something, and you decide whether to apply it. We thought about how meal-plan changes feel to a user, and concluded the same shape worked: don't replan invisibly, don't redo from scratch — show the *delta* and let the user accept or decline.

Crucially, the narrative anchors on what you care about: money saved, waste avoided, prep schedule simplified. Not "your variety score moved from 72 to 68." Real consequences in real numbers.

## Reality always wins

We have a rule we've been writing into the product since day one: **reality always wins.** If reality and the plan disagree, the plan adapts. The plan never demands the user adapts to it.

That's a different kind of meal planner. It's the difference between an app that demands you live a life shaped around it, and an app that lives quietly inside the life you already have.

## Coming next

The replan diff ships in the next major release, alongside calendar-anchored plans and the grooming ritual. The bones — recipe library, solver, fridge tracking — are all in place. We're connecting the experience now.

If you've abandoned a meal planner before because of a single bad day, this is what we'd love you to come back for.
