# Monk's TokenBar

Add-On Module for Foundry VTT

Add a token bar to show the current player tokens that are available on the current scene

## Installation
Simply use the install module screen within the FoundryVTT setup

## Usage & Current Features

Tokens display the current AC and Passive Percention.

Click on the token on the token bar to center on it.  Occasionaly I find that I lose track of where the players token is and thei is an easy way to get to it quickly.

Right click on the token to open a context menu with options to edit the character or token.  Or target the token.

Open a dialog to roll a Saving Throw for multiple selected tokens.
Select tokens, click the button to open the dialog.  Select what type of roll to make.  Optionally enter in a DC to beat, this will only show to the GM but will automatically determine if the roll passed or not.  Clicking the Add button will add any selected tokens not already on the list.
Public Roll will show everyone who's involved and their roll.  Private GM Roll will show the player everyone else involved but will only reveal their own roll/success.  Blind Roll will only show the player that they're involved and will not show the result of the roll.  Blind mode won't show the players at all.

Open a dialog to roll a contested roll
If a token is selected and another is set as a target it will automatically fill the two slots.  Otherwise the next token clicked will fill the next avaialble slot.  Individually select what roll the token will make.  After both partied have rolled it will show which one won the contested roll.

Open a dialog to assign XP
Automatically fill with the current player characters assocuiated with the current scene.  Add experience at the top and it will divide between the players evenly.  Once an encounter has finished, the dialog will automatically popup with the calculated XP for the encounter, divided evenly between the participants of the encounter.

Movement Limiting.
You can the limit the movement of tokens.  Or set the movement mode for individual tokens, in case the combat turn has moved on, and you want to grant the previous token movement so it can clean up it's position while you continue on with the rest of the encounter.

## Bug Reporting
I'm sure there are lots of issues with it.
Please feel free to contact me on discord if you have any questions or concerns. ironmonk88#4075

## License
This Foundry VTT module, writen by Ironmonk, is licensed under [GNU GPLv3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), supplemented by [Commons Clause](https://commonsclause.com/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).
