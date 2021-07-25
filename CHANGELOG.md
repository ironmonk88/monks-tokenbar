## Version 1.0.46 edit

Completely forgot to thank supervj for their work on fixing issues with SW5e compatibility!

## Version 1.0.46

Fixing issue with Assigning XP dialog getting NaN for xp to distribute.

Added the option to customise the number of stats being displayed.

When using the requestRoll API you can now call using English names instead of codes.  So calling with "perception" with translate to "skill:prc".

Requesting a roll will now default to the current tokens on the Tokenbar instead of all player controlled.

Moved dynamic items being added to the request roll dialog to the system object

Tokenbar attributes that are an object will default to trying to find the .value of the object.

Fixed issue with using fastForward and requestRoll from the API causing an error.

used libWrapper to encapsulate canDrag override.  This should stop the message getting flagged from DF-QOL.

Added skills to SWADE, so they'll now appear when requesting a Roll.

## Version 1.0.45

Fixing issues with finding the proper tokens for the Tokenbar.

## Version 1.0.44

Allow saving throw to return a value if the request passes or fails.  This is for integration with Monk's Active Tiles.

Added option to stop remaining actions if the saving throw passes of fails.

Updated display name for action to better describe what the request is regarding.

Fixed an issue with the API when requesting a saving throw.

Adding SWADE support.

Added option to bypass chat messages in PF1.

Fixed issues with rolls in PF2.

Updated support for SFRPG to bypass chat messages.

Fixed an issue with distributing XP by levels.

Addedd option to select or deselect tokens from the token bar.

Changed how the saving throws display the dice value... which I'm nervous about 'cause it could go wrong.

## Version 1.0.43

Fixed some minor issues with Active Token Trigger support

Added option to bypass the dialog and roll silently.

## Version 1.0.42

Added support for Monk's Active Token Triggers

Added support for the API function to change movement status using token name

Fixed lootables issue

Fixed issue setting individual token movement

Added option to allow previous token in combat to continue moving to "clean up" while the turn moves on.

Added option to show a movement button on the Combat Tracker, so you can easily give a player movement when it's not their turn.

## Version 1.0.41

Fixing issues with lootables not removing the items properly.

Added alpha to tokens that are lootable

Added notification if requesting a roll and you press the Add+ button and now tokens have been selected

fixed an issue in the code where I referred to a token id instead of a document id

## Version 1.0.40
Fixing issue with lootables calculating gold

Fixing issue with lootables finding correct combatants

Fixing issue with assigning xp dialog

Fixing issue with xp going to Wildshape form

## Version 1.0.38
Updated the code to switch from using game.world.system to game.system.id because game.world.system no longer works with 0.8.x

Added uuid and request options to the chat message created by tokenbar

Fixed issues with lootables

Fixed issue with Initiative calls not working

Removing the chat messages when rolling for initiative

Updated PF2E so that request messages aren't shown.

## Version 1.0.37
Added support so that options used to request the saving throw are added to the chat message

Added token uuid to the chat message

Updated the saving throw API to use strings of token names, making it easier to request a roll in a macro.  A little more accessible if you don't know how to code.

## Version 1.0.36
Support for 0.8.x

## Version 1.0.35
Fixing assign XP issue where actors wern't being assigned XP correctly

Fixing issue where having both XP and lootable windows popping up at the same time were overlapping or one was pushed against the left side of the screen

Fixing an issue where Pathfinder wasn't getting the correct flavor text for requested rolls

## Version 1.0.34
Fixed issue with removing conditions using CUB

Adding support to hide the NPC's name from the players on the contested roll chat message.

Adding support to hide an NPC from the players on the contested roll chat message if they are currently hidden.

Fixed an issue where broken image files were causing an error and preventing the token bar from loading.  Thank you Shade Ninja for catching that.

Fixed an issue where players TokenBars weren't updating the resource bars or displayed stats.

Added support for changing the sound played when requesting a roll

## Version 1.0.32
Updated the code to handle different systems better.

Added better error trapping in case a roll doesn't go as expected.

Added a different interface for selecting a requested roll.  Hopefully making it easier to find the right one quickly.

Added support for PF1, Starfinder, DnD4e, and DnD3e

Added an API to alter the buttons that are shown on the TokenBar.

## Version 1.0.31
Fixing issue with the formula not calculating numerics properly.

Fixing issue, hopefully, with dropping multiple tokens on the board.

Fixing styling issue with the token bar

Adding more logging information

## Version 1.0.30
Fixing issue with replaceAll, changing it back to replace.

## Version 1.0.29
Fixing issues with the formula, and some related spacing issues with any value that overflows

Removing some console logging that didn't really need to be there any more.

Added support for different ways to distribute xp. (Thank you so much Jonas Karlsson)

Swedish translations (Also thank you Jonas, much appreciated)

Adding hooks for dice results

Allow NPC's controlled by a player to move during players turn in combat.  So summoned creatures can be used more effectively.  (Thank you hmqgg)

## Version 1.0.28
Added option to use a formula with the stats displayed

Added support for Star Wars 5e (Thank you baccalla!)

Added Japanese updates (Thank you as always touge!)

## Version 1.0.27
Adding sound effect when a roll has been requested to alert players

Added lootable menu to the token main menu

## Version 1.0.26
Fixing issues with the API, especially with running the function using silent.

Fixing issues with checking for token changes

Fixing issues with Tormenta 20

Fixing issues with Sandbox

Fixing up the rendering speed

Switching the token to use thumbnails of the images to increase the speed of rendering.

## Version 1.0.25
Fixing issue with stacked pathfinder conditions.

Fixing issue with Tormenta20 (Thank you mclemente!)

Fixing issue with request options for requested roll.  This was preventing running the request silently.

## Version 1.0.23
Fixed an issue with the code to find tools.

## Version 1.0.22
Fixed an emergency issue where code is preventing buttons from working

## Version 1.0.21
Fixing issue with toolkits not rolling.

Fixing issue with animated token images being updated.

Adding option to grab player rolls that they didn't roll in the chat message.

Fixing issue with repositioning.

Fixed an issue with the private message context menu showing for players that weren't logged in.

Adding perception as default second stat from pathfinder 2e

Fixing issue with the stat being blanked out if the stat returned a 0.  Converting the value to a string instead.

## Version 1.0.20
Fixing contested roll with OSE

Added option to hold down either Ctrl or Alt when clicking the dice rolls for requested rolls to roll with advantage or disadvantage.

Fixing Pathfinder XP

Fixing css styling

## Version 1.0.19
Adding Initiative to the requested rolls

Added plain dice to the requested rolls

Removed token animation from the TokenBar, it just ended up being too much of a headache.

Updated the function that updates the tokens on the bar.  It will now check for changes first and instead of replacing the entire dataset, it will just update what's needed.  This should catch all the weird cases where the token updates but the bar doesn't.

Respecting the setting if the resource bars are always to be hidden they won't show up on the TokenBar.

Fixing some styling issues with the TokenBar

Added option to split the expereience between players or add directly.

## Version 1.0.18
Fixing issue when a toolkit rool is requested but the item can't be found, then an error is throw.  Added a check to make sure the tool in question can be found.

Added Private Message to the right click menu on the tokens to start a private message with the player that owns that token.

Added support for OSE

Made the second stat customisable

Attempted to allow the TokenBar to be popped out, but that didn't work very well.  Left the code to go back to it at a later time.

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
