## Version 1.0.7
TokneBar will respect DnD5e request to disable XP tracking and will hide the XP button on the bar and not open the XP dialog if the checkbox is checked.

## Version 1.0.6
Fixed issue with movement notification showing even though no movement change has happened.

Fixed the bug where a player could still move their token with arrow keys even though movement was locked

## Version 1.0.5
Fixed issue with the global movement status only clearing out the first token's specific movement.  Looks like I wasn't waiting for the setFlag function to complete before moving on to the next one.

Added greater visibility for specific movement settings.  The context menu will now highlight whatever movement setting the token has.

After combat was complete, the Assign XP Dialog was showing for everyone.  Limited that to just the GM.

## Version 1.0.4
Fixing an issue with tokens that don't have passive perception for some reason

## Version 1.0.3

Bug fixes.
The movement restriction wasn't working.
Stripped out the things that weren't working in Pathfinder.
Corrected issues with the turn notification
