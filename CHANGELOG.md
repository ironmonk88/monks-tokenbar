## Version 10.9

Added the option to set the attribute icon to blank

Fixed lootables so that currencies that didn't exist aren't added to.

Added the option to use the currencies specified in Monk's Enhanced Journal if using that module for your loot.

Added the option to select tokens from either the players or the token on the token bar when requesting a roll.

Added the option of specifying a roll code when creating an inline roll for a journal entry.  This way tokenbar can distinguish between a Strength saving throw and a regular Strength roll.

Fixed issue when requesting a contested roll from an inline link in a Journal Entry.

Fixed issue where inline links would open a roll request twice.

Fixed issues with SFRPG, xp will show again, and calculating xp won't throw an error.

Fixed issue with SW5e, calculating xp won't throw an error.

## Version 10.8

Removing debug code so that the tokenbar can be repositioned properly.

## Version 10.7

Changed the assign xp dialog to allow GMs to select which creatures get used to computer the XP.

Also updated the assign xp dialog to be able to select both creatures and players to include in the dialog.

Fixed issues with contested rolls to using the correct notation.

Fixed issues with the contested roll not updating properly.

Added the option to only use defeated tokens when calculating lootables.

Fixed the way loot name is generated.

Fixed issues with Item Piles support.

Changed saving throws to allow for selecting skills that not all actors have.  This allows for things like thieves' tools to be included in a request with a dexterity skill check.

Added the additional requested rolls to the chat card title.

Added the request selected by the player to the actor list on the request roll chat card.

Added the option to select multiple request using the meta key for Mac users.

Fixed issues calculating the group DC.

Fixed issue with the tokenbar starting too far to the left when it's first used.

Added temporary hp to the tokenbar display bars.

Prevented the whisper option on the tokenbar context menu from showing if you own the actor.  So you don't whisper to yourself.

Switch to the chat tab when selecting whisper from the context menu.

Added the option to exclude an actor from the context menu.

Fixed issue where combat movement wasn't being changed is you had an assisstant GM.

Fixed issues with getting roll information from an Initiative request.

Fixed issues with showing lootable convert option in the settings when using Pathfinder 2e.

Updated the message when an actor is available to level up, to have a button to press to handle leveling up the actor.

Added check for level up when the actor is updated, not just from the assign xp dialog.

Fixed issues when changing a private request roll message to public, and back.

Fixed issues with getting an actors level.  Thank you JDCalvert for the heads up.

Fixed issues with how PF2E handles requested rolls.

Fixed issues with the edit stats dialog overflow when there are a lot of stats selected.

## Version 10.6

Added a check to make sure adding XP only adds to tokens that are linked to an Actor.

Fixed issues calculating XP values from Actors that didn't have a max or value for xp.

Removed 'melee', 'condition' and 'spellcastEntry' from items lootable will collect.

Fixed issues collecting currency from Actors in PF2E.

Fixed issue changing if you want the loot entry to be automatically opened.

Fixed issue with Lootable name

Fixed issue with getting the default Loot Entry name.

Fixed issue with the loot being added to loot entries not correct, and not able to be assigned to players.

Fixed issues with saving throws when a token with tools is addded or removed from the Dialog.

Added option to use handlebars in flavor field when requesting rolls in MATT.

Added the option to select lore rolls in PF2E.

Fixed resizing issues with the saving throw dialog.

## Version 10.5

Fixed issue with Contested Rolls not responding to the ctrl or alt keys.

Added the option for Contested Rolls to have the advantage and disadvantage buttons.

Added the option to use the Meta key to target tokens using the tokenbar.

Prevented players from double-clicking on tokens to request a roll if they aren't allowed to request rolls.

Fixed incompatability with MidiQol.

Fixed issue with Tormenta 20 system.  Thank you Lander13

## Version 10.4

Fixed issue with contested roll not rendering the correct ids

Added the option to show an advantage and disadvantage button in addition to the regular roll button.  For DnD5e.

Fixed issue with initiative requested rolls not having the correct roll data.  This is because the data was faked, since the correct data is never passed through.

Fixed issue refreshing tokenbar when the actor ownership is changed

Fixed issue with updating token bar when active effects are altered.

Added a setting for player permissions required to view tokens on the tokenbar.  This means you can set other players permission to observer or limited so the token will appear on all players tokenbar.

Fixed issue witht he tokenbar wandering to the right anytime it was expanded and collapsed.

Added the option to alt click on a token while in no movement mode to individually assign movement.  This way you can let each player move one by one.

Made the grabbable status a little more noticeable when you're attempting to grab a message.

Fixed issue with the name shown for the loot entity.

Fixed issue with the default requested roll in dnd5e.

Fixed issues with experience point in ds4.

Allowed pf1 to grab requested roll messages.

Fixed issue with the default loot entity name.

Reworked the lootable dialog so that you have more control over what items are being added.  It will now group like items together to conserve space, so if you have multiple skeletons, instead of adding an item for each monster it will just show one set of items, with an increased quantity.  You can also in the dialog set where the loot is going, so in the settings you can set the default value, but you can change this whenever you create loot.

## Version 10.3

Fixed issues with calculating xp in pf2e

Fixed issue with assigning xp that's not a number

Fixed issue with contested rolls not getting the correct request value.

Fixed issue with getting currency when compiling lootables after a combat

Fixed issue with lootable generated for Monk's Enhanced Journal deleting after the first item is updated.

Added the option to start a combat if initiative is requested and no combat is available.

Fixed issue with finding the owner of a token.

Fixed issue where rolling initiative was throwing an error in pf1.

Fixed issue with Saving Throw when no default request has been determined.

Fixed issue where active effects aren't updating the token bar values

Remove tokens added by multilevel tokens.

Only notifying once on movement change if there's more than one GM logged in.

Added the option to use tagger when selecting tokens for a roll request

Fixed issue with pf1 when skipping the dialog is requested.

Moved the inline request roll feature from Monks Enhanced Journal to this module, since it's the one doing the work.

## Version 10.2

Updated the assign XP dialog to allow you to customise the actors that are being assigned XP.  It will remember the last tokens to assigned XP to, can use the current combats tokens, or you can drag and drop and actor onto the dialog to add them to the list.

Also added the option to auto assign XP instead of having to click the add button in the chat card.

Updated the add xp chat card to highlight that the add button is clicakble as it gets a little hidden.

Updated request roll and contested roll to be able to request multiple options.  So if you need to check for either an athletics or an acrobatics roll, you can do that.  Contested Roll does not offer that option in the interface, but can be configured in the API and run from a macro.

Updated the request roll chat message to allow them to be popped out.

Updated the lootable dialog to only clear if the confirm button is visible.  This shouldn't have been an issue, I just wanted to make sure it wasn't going to be one.

Added the option to collapse the tokenbar icons in case ou want more screen room, or don't want to see the player icons.

Fixed an issue updating the selection when changing in the settings how loot is distributed.

Fixed an issue introduced by Foundry when serializing the Roll in the Chat card.

## Version 10.1

Fixed issues with assigning xp, leaving the old xp visible on disabled actors.

Switched the setting to select how to deliver lootables to be more inline with how Enhanced Journals is displaying them.

Fixed lootables to work correctly in v10 and with Enhanced Journals.

Fixed issues when switching scenes and refreshing tokens.

## Version 1.0.71

Fixed an issue that the latest v10 update broke.

## Version 1.0.70

More v10 fixes

## Version 1.0.69

Added v10 support.

## Version 1.0.68

Update assign xp so it only adds actors that are owned by players.

Fixed issue with adjusting xp manually

Fixed issue with contested roll macro command when tokens don't exist.

Fixed issue with contested roll and saving throw, passing in a callback function.

Added setting to allow players to roll.

Fixed issue with finding default tokens for contested roll

Fixed issue with PF2E and the token bar dropdown no longer being shown.

Fixed issue with contested roll Active Tile command.

Added assign xp action to Active Tiles.

## Version 1.0.67

Fixed blind rolls being shown when using Dice So Nice.

Fixed issue when hover over was showing the results even though they were supposed to be hidden.

Added the option to drag and drop stats.

Fixed issue with finding tokens when passing null to request roll.

Added the option to set the resolution of the token bar images.

Fixed inspiration positioning when using vertical orientation.

Restricted the keys used to open a request roll.

Fixed issue when using Active Tiles to request a contested roll.

## Version 1.0.66

Fixed an issue with Contested Roll trying to find a winner when not all rolls were received.

Fixed an issue where editing stats was crashign in PF2E.

Fixed an issue in lootables where it wasn't getting the correct value for currency

Added the option to pass in the name property to the Request Roll macro and have it replace the name of the roll being rolled.

Switched the request roll keyboard shortcut from using Shift to Alt Shift

Fixed issue with tokenbar trying to find tokens when no tokens were passed to it.

Changed the Active Tiles action to clarify Global Movement rather than just Movement.

Changed the contested roll chat message to display the buttons the same way the requested roll does.

## Version 1.0.65

Fixed an issue with the chat card buttons displaying strangely

Fixed an issue with the sounds still playing when the GM has turned them off for self rolls

Fixed an issue with lootables when currency is involved.

## Version 1.0.64

Added checks for saving throw and contested roll request to make sure the roll mode is valid

Added code to use silent and fastForward when requesting a Contested Roll, thank you thatlonelybugbear

Added the contested roll to the actions that can be called using Active Tiles.

Added the option to not play sounds when it's just the GM rolling

Added Item Piles support for TokenBar

Fixed some issue when converting to lootables

Added the option to show the DC to layers when requesting a saving throw

Saving a requested roll to a macro will now use Token names, so if the token is destroyed, or if you're on a diferent scene you can still use the macro.

Added the option to use degrees of success, thank you rlach

Added a little bit of clarity as to how tokenbar is selecting tokens.  So you can turn on debugging now and see whay tokens are getting included and excluded.

Fixed whisper to from the tokenbar for layers that have a space in their name.

Fixed issue where double-clicking a token on the tokenbar was also registering as a single click.  I just found it a bit annoying.

Added the option to change what actions are performed when double clicking the token on the tokenbar.

Added key bindings so you can request a roll by pressing Alt-R and a GM only Roll by pressing Shift-R.

Fixed an issue where the tokenbar would disappear when you changed scenes.

Fixed an issue when trying to grab a saving throw chat message.

## Version 1.0.63

Fixed issue where Lootable currency was being added as a string rather than as numbers.

Fixed issue where a null value in the currency field was causing lootables to ignore that it was there.

Fixed issue with the name change of DnD4e Beta.

Fixed issue with removing second token in contested roll.

Updated integration with Active Tiles.

## Version 1.0.62

Fixed an issue with macros generated not gettign the correct roll mode when calling a requested roll.

Added Save to Macro for contested rolls.

Fixed an issue when determining if there are previous loot entity when creating the new Loot Entity name.

Fixed up the action text when converting so that it accurately reflects what's happened.

Added the option to open the loot entity once the items have been looted.

Fixed an issue where adding a token to a saving throw was failing.

## Version 1.0.61

Fixed issues with converting lootables from combat.

Fixed issues with reverting lootables.

## Version 1.0.60

Fixed issue with additional keys not being passed through properly

Updated Lootables so you can now specify how much coin each actor is providing, as well as which items are being included in looting.
It will now also use Enhanced Journals to create a lootable entity.

Added the option to save a Request to a macro.

Reordered the settings menu.

Fixed issues with assigning XP in multiple systems

## Version 1.0.59

Fixed issues with using Ctrl or Alt to add Advantage or Disadvantage to a roll.

Fixed issues with editing custom stats

Fixed issues with Lootables not changing to Loot Sheet properly.

Fixed an issue when a scene has no Tokens attached to it, or if there's no scene added.

Wrapper Scene.prototype.view properly.

Added option to specify Advantage and Disadvantage with the API when requesting rolls.

Added Current Tokens to the options when selecting an entity for requesting a roll.

Added the Resume anchor when deciding what to do with tokens that passed or failed, once those are dealt with you can now resume actions with all tokens.

## Version 1.0.58

Fixed issue with vertical alignment and no tokens.  The tokenbar shrunk improperly.

Added a line between Target Token and Free Movement in the context menu when clicking on a token.

Fixed an issue that was preventing the module from stopping tokens from moving.

Changed the Active Tiles integration so that you can select global movement rather than leaving the entity blank to indicate a global change.

Updated the code with Active Tiles upgrades

Changed the default of allow movement after turn to false.

Fixed up issue with PF2E rolls.

## Version 1.0.57

Fixed an issue with combat turns in v9.  Refrences to the token involved have changed.

Clarified what's happening if you try and convert lootables but no loot sheet is selected.

## Version 1.0.56

When the saving throw request is closed, informing Active Tiles that the state information is no longer needed.

Moved the token indicators higher in the z-order so they appear above the bars.

Added the option to change the global movement state if no entity is selected.

Added flavor text to the request roll via Active Tiles.

## Version 1.0.55

Added option to return the chat message created when prompting to assign xp

Converted contected roll to use an array of tokens like saving throw does, to maintain some consistency

Recentered the contested roll dialog.

Fixed issue with contested rolls not working from the API, thank you p4535992 and thatlonelybugbear

Added option to specify if individual tokens can be fast forwarded or if they have advantage or disadvatage, in both contested and requested rolls.  This means there's a new way to request these rolls, instead of an array of strings or token ids you can now specify an array of objects.  So `game.MonksTokenBar.requestRoll([{token:"Thoramir", altKey: true},"John Locke", {token:"Toadvine", fastForward:true}], {request:'perception',dc:15, silent:true, fastForward:false, flavor:'Testing flavor'})` is now possible, to give advantage to Thoramir and to auto roll Toadvine.

Added option for flavor text with contested and requested rolls, thank you thatlonelybugbear

Changed how the sounds are played so only the relevant players will hear it.

Added the option to request the roll with all the dice being rolled.

Fixed an issue with contested rolls and who gets to see who passed and who failed.

Added option to grab rolls with contested rolls.

I've also reduce the restrictions when grabbing rolls, so you can now grab any roll and use that in contested or requested rolls.  So this is a bit of a beware, it will grab any roll message you click on.  But it also means that you can grab unrelated rolls if your character wants to roll althletics instead of acrobatics for example.

You can now edit the stats for individual tokens.

Added option to change the width of the tokens being displayed on the token bar.

Stats can now use handlebar notation

Stats can also have text in quotes

Updates tp Spanish and Catalan languages, thank you jvir

Updates to Japanese translation, thank you BrotherSharper

## Version 1.0.54

Fixed issues with Loot sheet not opening due to currency issues.

Fixed issues with lootables not syncing up with players

Added option to select what loot sheet is used.  So you can now use either Loot Sheet or Merchant Sheet

Updated code so that request rolls from Active Tiles can now be delayed until all players have rolled.

Fixed spelling mistake in API that was preventing Contested Roll from being fast forwarded.

Added filter for Active Tiles so you can do one thing with failed tokens, and another with successful ones.

## Version 1.0.53

Changed saving throws to pass information about which tokens passed and failed.

Changed saving throws to continue on [Always, Any Failed, Any Succeeded]

Changed saving throws to set current tokens to those that failed or succeeded.

Started work on integration with CoC7.

## Version 1.0.52

Moved checking for levels and getting xp to the system modules.  Should make assigning xp a little more flexible.

Allowed contested roll to roll all.

Added the option to select multiple tokens using the Shift key when clicking on either the tokens on the token bar, or tokens in the chat message.  Thank-you happy-cujo

Added buttons to the chat message to select either all related tokens, tokens that passed the saving throw, or those that failed the saving throw.  Thank-you happy-cujo

Fixed issue where contested roll wasn't updating the final result.

Moved the gold formula to the settings so that GMs can set their own way of calculating gold.

Changed the saving throw select dialog to alter height according to what's displayed.

Optimized the token bar a little bit.  
Thumbnails are stored between scenes so that it doesn't have to compress the characters image each time.
Moved the needed hooks into the initialization function, so if the tokenbar is disabled, they're not loaded.
Updated the function that renders the tokenbar  and optimized that code that collects the token data.

Fixed an issue where switching scenes rapidly would cause the tokens to disappear.  That was a weird one.

Allow players to see tokens from characters they have observe permissions on.

Added the option to show the tokenbar vertically.

Added option to disable panning when clicking on tokens on the tokenbar. Thank you surged20

Added the option to pass keypress data into the API function.  This will allow calling functions to set Advantage and Disadvantage when rolling all.

Added the option to capture saving throws.  So if a chat card allows you to roll a saving throw you can have it create a Saving Throw roll through Tokenbar instead.

Fixed issue where the results of a saving throw weren't being passed to Active Tiles properly.

Updated Tormenta20 code.  Thank you VHPaiva.

## Version 1.0.51

Fix to pass data back to Active Tiles instead of just true/false

## Version 1.0.50

Fix to make it work with updated Active Tile code.

## Version 1.0.49

Minor fix with the Active Tiles update.  Missed a spot where I didn't convert to the Token from TokenDocument.

## Version 1.0.48

Fixed the fix of an issue with lootable.  Turns out that it was workign properly, but that I was loading the tokens inproperly when manually converting to lootable.

Fixed an issue with resource bars showing up on an update even if they're not supposed to.

Switched use of entities to contents.

Fixed an issue where resource bars weren't aligning properly when more than two attributes were added.

Added the appropriate reference to Catalan and Spanis translations.

Updated the interface with Active Tiles to use the correct information being passed.

## Version 1.0.47 edit

Sorry I keep missing contributions.  Thank you to jvir and Montver for Spanish translations

And thank you to touge as always for the Japanese updates

## Version 1.0.47

Tokenbar will no longer play the request roll sound when roll mode is set to self roll.

Fixed issue with tokens not showing on Old School Essentials

Changed name from Ability to Attribute in SWADE

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
