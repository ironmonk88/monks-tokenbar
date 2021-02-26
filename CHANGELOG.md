## Version 1.0.18 - In Development -
Fixing issue when a toolkit rool is requested but the item can't be found, then an error is throw.  Added a check to make sure the tool in question can be found.

Added Private Message to the right click menu on the tokens to start a private message with the player that owns that token.

## Version 1.0.17
Added support for Death Saving throw

Added support to request a roll for tools.

Added ability to recall the last set of tokens used for a requested roll

Added support for Tormenta20 and translation corrections (Thank you mclemente!)

Added Japanese translations (Thank you touge!)

## Version 1.0.16
Fixed issue with dice tooltip showing when request was sent as a blind gm roll

Added API functionality, but still need to document how to use it

Fixed an issue where npc's converted to lootable weren't able to revert due to no old items saved from being converted to lootable.

## Version 1.0.15
Added option to change defeated enemies into lootables if you have Loot Sheet installed.

Fixed issue with webm tokens not being displayed.

Fixed issue with tokenbar disappearing off the edge of the screen when the browser is resized.  If the token bar is repositioned near the bottom half of the screen it will position relative to the bottom, not the top.  And added a button to the configuration setup to reset the tokenbar position.

## Version 1.0.14
Adding option to disable the token bar, now that it's available for players to see.

Added the option to turn off changing the movement to combat when an encounter is started.

Changed the Add player on the request saving throw to add the currently selected tokens, rather than using it as a toggle switch to add tokens being clicked.  It was very unintuitive.

Changed to the code so that Pathfinder changes to ac and perception are reflected.

## Version 1.0.12
Adding a setting so that players can now see their own tokens on a bar.  Should be helpful for players with companions.

Sort of added the start of customisable stats for the bar.

## Version 1.0.11
Adding support for pathfinder rolls

## Version 1.0.10
Fixed issue with saving throws getting into a loop informing each other that the roll had finished.

Fixed an issue with contested rolls not rendering properly.

## Version 1.0.9
Fixed issue with multiple tokens being added or removed from scene.

You can now reposition the token bar.

Chinese translations

Fixed an issue where multiple tokens associated with a single actor only rolling once.

Remember the last roll mode and reuse it the next time opening the saving throw.

## Version 1.0.8
Fixed issues with the players not able to roll.

Upgraded some of the code behind the scenes to make it all a little more stream lined.

Upgraded the contested roll scripts to use code upgraded for the saving throws.

## Version 1.0.7
TokenBar will respect DnD5e request to disable XP tracking and will hide the XP button on the bar and not open the XP dialog if the checkbox is checked.

Fixed issue with a mass roll not updating properly.

Added the option to show the tokens resource bars.

Cleaned up the code a bit so that macros can call it easier.

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
