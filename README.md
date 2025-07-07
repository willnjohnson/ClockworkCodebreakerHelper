# Clockwork Codebreaker Helper

This Greasemonkey script assists with the Clockwork Codebreaker game on Neopets by helping deduce the correct code through an interactive UI.
It keeps track of your attempts, feedback, and narrows down the possible combinations based on your inputs.

Alternatively, if you prefer not to use this GreaseMonkey script, you can use my Codepen version below:
https://codepen.io/wnj/pen/ogXKLJr

Enjoy, and hope you earn that easy gold trophy!

## Features

* **Stage Selection Interface:**
  * Choose between Stage 1, 2, or 3 to match the game's current difficulty level.

* **Code Suggestions:**
  * Colors are suggested automatically to the user, so the user just needs to check in game to see what the indicators show for that combination.
  * User provides feedback by input into the helper what color the signals are.

* **Interactive Feedback Panel:**
  * Select indicator results (🔴 red, 🟡 yellow, 🟢 green).
  * Automatically filters out invalid combinations after each test.

* **Reset:**
  * When a stage is completed, you can select the Reset button and select the next stage.

* **Select Prev.:**
  * Select previous indicators as quick shortcut, if your current prediction is similar to your previous prediction.

## Installation

This script requires a user script manager like Tampermonkey or Greasemonkey.

1.  **Install a User Script Manager:**

2.  **Create a New User Script:**

    * Click on the Greasemonkey/Tampermonkey icon in your browser's toolbar.

    * Select "Create a new script..." (or "New script").

3.  **Paste the Script:**

    * Delete any existing code in the new script editor.

    * Copy the entire code from the Sakhmet Solitaire Helper script and paste it into the editor.

4.  **Save the Script:**

    * Save the script (usually Ctrl+S or File > Save).


## Usage

1. Go to the [Clockwork Codebreaker game page](https://www.neopets.com/games/game.phtml?game_id=1173) on Neopets.

2. The Clockwork Codebreaker Helper will appear on the top-right. Choose your stage (1, 2, or 3).

3. Select one indicator (🔴🟡🟢) for each row.

4. Click **Test** to see what combination is suggested for your next move.

5. Repeat testing until the helper narrows down the correct combination.

6. Once the puzzle is solved, select the next stage.

## Compatibility

* **Browser:** Compatible with modern web browsers (Chrome, Firefox, Edge, Opera) using a user script manager.

* **Game:** Designed specifically for the Neopets Clockbreak Codebreaker game.

## Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, feel free to open an issue or submit a pull request.

## License

This project is open-source and available under the MIT License.

**Disclaimer:** "Neopets" is a registered trademark of Neopets, Inc. This script is an unofficial fan-made helper and is not affiliated with or endorsed by Neopets, Inc.
