## What 70 percent of users have in common

The diet-and-nutrition app industry has an uncomfortable, well-documented statistic: roughly 70 percent of users abandon a new app within two weeks. Most don't even reach the second meal plan. By day 30, retention is under a third.

We've been thinking about this number for about a year, and we've come to a conclusion that mostly disagrees with how the industry talks about it.

The mainstream answer is "make the app stickier" — push notifications, streak counters, daily check-ins, in-app rewards. We don't believe that. Adding more reasons to open an app you've already decided isn't helping you is not a solution; it's an annoyance on top of a failure.

## What we think actually happens

A new user signs up on a Sunday evening. They generate a plan, look at it, feel mildly hopeful, close the app. Monday — fine. Tuesday — workable. Wednesday at 7 p.m. they walk past a gyros stand, eat a gyros, and the plan they made on Sunday is now lying to them.

Most apps respond to that moment by silently breaking. The plan is still there. The numbers are still tracked. But the user knows the numbers are now nonsense, and the app pretends nothing happened. By Thursday they stop opening it. By Friday they've deleted it.

That's the cliff. Not motivation. Not laziness. The app's inability to absorb reality.

## What we're doing about it

The "git diff" replan is our answer to this. The day after a gyros — or a missed cooking night, or a child's birthday at school, or a Wednesday that just slid — Kalmio recomputes the rest of the week and shows you what would change, as a small narrative. *Shift Thursday's dinner to Saturday, drop the Friday lunch we won't realistically cook, pull more from the fridge instead of buying.* Accept or decline.

The point isn't the algorithm. The point is the gesture: **the app is not pretending Wednesday didn't happen.** It saw the gyros. It rearranged around it. It's offering you a sane next move.

In our early testing — small numbers, only forty-something users so far — the people who used the replan diff at least once in their first two weeks stayed engaged at roughly 2.5× the rate of those who didn't. We're not publishing that as a real retention number yet; the sample is too small and the test wasn't blinded. But the qualitative signal is consistent enough that it now drives where we put engineering hours.

## Why this is a Hungarian story too

There's a specifically Hungarian flavor to this. The day-1 Kalmio user in our heads is the person who has tried — and given up on — three or four diet apps. They are not new to the cycle. They have a defensive crouch about meal plans by the time they reach us, because every prior plan has implicitly blamed them for not following it.

The replan diff is, partly, a tone of voice. It says: *you ate a gyros and it's a Wednesday and the only sensible response is to recalibrate, not to scold.* If we can be the first app in their history that doesn't quietly disappoint them on a Wednesday, the two-week cliff stops being a statistic about Kalmio.

## What we're not doing

We're not adding streaks. We're not adding daily push notifications. We're not gamifying the daily open. There will be a small points system later, but it counts good kitchen decisions — using up an aging ingredient, completing a prep window, finishing a plan — not how many days in a row you opened an app.

We'd rather you open Kalmio on Sunday to plan, on Wednesday because something went sideways, and otherwise live your life. The most successful Kalmio user is one who barely thinks about Kalmio.

That's the opposite of the industry incentive, and probably the only honest version of the product.

## Tell us when we fail

If you've already hit your own private two-week cliff with us, we want to hear about it more than anything else. What was on Wednesday? What did the app pretend wasn't happening? Use the feedback panel. Even better: tell us the exact moment you almost closed the tab for good. That's the data we work from.
