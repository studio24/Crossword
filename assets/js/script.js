$(document).ready(function () {
	var puzz;

	//AJAX call to get puzzle in JSON
	$.ajax({
		url: "/assets/json/oldPuzzle.json",
		async: false,
		dataType: 'json',
		success: function(data) {
			puzz = data;
		}
	});

	$("body").on("click", "#showSolution", showSolution);
	$("body").on("click", "#save", save);
	$("body").on("click", "#check", checkAnswer);
	$("body").on("submit", "#puzzleForm", function (e) {
		e.preventDefault();
		submit();

	});

	//Make the crossword
	$('#puzzle-wrapper').crossword(puzz);

	restoreCrossword();
	showButtons();

	//Show the solution on screen
	function showSolution(){

		for(var i = 0; i<puzz.puzzleData.length; i++){

			//Get the answer and the coordinate of the clue
			var answer = puzz.puzzleData[i].answer;
			var firstCoord = $(".position-" + i).attr('data-coords');

			//Fill in the answer
			for(var j = 0; j < answer.length; j++){
				var newCoord;

				//Check if the puzzle is across or down
				if (puzz.puzzleData[i].orientation === 'across'){
					var xCoord = parseInt(firstCoord.substr(0, firstCoord.indexOf(','))) + j;
					newCoord = xCoord + firstCoord.substr(firstCoord.indexOf(','));
				}
				else {
					var yCoord = parseInt(firstCoord.substr(firstCoord.indexOf(',') + 1)) + j;
					newCoord = firstCoord.substr(0, firstCoord.indexOf(',') + 1) + yCoord;
				}

				//Fill 1 letter of the answer into the box
				$("[data-coords='" + newCoord + "'].position-" + i + " input").val(answer.substr(j, 1));
			}
		}
	}

	//Save the current progress of the puzzle
	function save() {
		var crossword = [];

		//Try to save it into the Local Storage
		//Show message if it didn't saved
		try {
			for(var i = 1; i < $("tr").length + 1; i++){
				crossword[i] = [];

				//Store the letters in the correct coordinates in the array --> easier to restore the puzzle
				for(var j = 1; j < $("tr:first td").length + 1; j++){
					var coord = i + ',' + j;
					crossword[i][j] = $("[data-coords='" + coord + "'] input").val();
				}
			}

			//Store the puzzle with crosswordId as the key
			localStorage.setItem(puzz.crosswordId, JSON.stringify(crossword));

			alert("Saved")
		} catch (e) {
			alert("Something went wrong")
		}
	}

	//Restore the progress of the puzzle from Local Storage and show it on screen
	function restoreCrossword() {
		//Check if progress exist in Local Storage
		if (localStorage.getItem(puzz.crosswordId) !== null) {
			var crossword = JSON.parse(localStorage.getItem(puzz.crosswordId));

			//Put the letters back in their right places with the coordinate from the array
			for(var i = 1; i < $("tr").length + 1; i++){
				for(var j = 1; j < $("tr:first td").length + 1; j++){
					var coord = i + ',' + j;
					$("[data-coords='" + coord + "'] input").val(crossword[i][j])
				}
			}
		}
	}

	//Check if the puzzle is solved correctly
	function checkAnswer() {
		for(var i = 0; i<puzz.puzzleData.length; i++){

			//Get the correct answer
			valToCheck = puzz.puzzleData[i].answer.toLowerCase();

			//Get the answer on screen
			currVal = $('.position-' + i + ' input')
				.map(function() {
					return $(this)
						.val()
						.toLowerCase();
				})
				.get()
				.join('');

			//Check if there's a wrong answer
			//If there's none then the puzzle is solved correctly
			if(valToCheck !== currVal){
				alert("puzzle not solved");
				return;
			}
		}

		alert("you solved the puzzle");
	}

	//Submit answer from the user
	function submit() {
		var crossword = [];

		//Get all the answers
		for(var i = 1; i < $("tr").length + 1; i++){
			crossword[i] = [];
			for(var j = 1; j < $("tr:first td").length + 1; j++){
				var coord = i + ',' + j;
				crossword[i][j] = $("[data-coords='" + coord + "'] input").val();
			}
		}

		//Post the answer with the form
		$.ajax({
			type: 'POST',
			url: '/processForm.php',
			data: {
				alumniNr: $("#alumniNr").val(),
				name: $("#name").val(),
				email: $("#email").val(),
				college: $("#college").val(),
				yearOfMatric: $("#yearOfMatric").val(),
				notes: $("#notes").val(),
				crossword: JSON.stringify(crossword)
			},
			cache: false,
			success: function (data, status) {
				alert("You have sent the answer.")
			}
		});
	}

	//Show the correct buttons and form
	function showButtons() {
		//Show the save button
		$("body").append("<button id='save'>Save</button>");

		//Check if it can show answers
		if (puzz.showAnswer){
			$("body").append('<button id="showSolution">Show solution</button>\n' +
				'<button id="check">Check answer</button>');
		} else {
			$("body").append('<form id="puzzleForm" method="post" >\n' +
				'\t<label for="alumniNr">Alumni number:</label>\n' +
				'\t<input name="alumniNr" id="alumniNr" type="number">\n' +
				'\t<label for="name">Name: *</label>\n' +
				'\t<input name="name" id="name" type="text" required>\n' +
				'\t<label for="email">Email: *</label>\n' +
				'\t<input name="email" id="email" type="email" required>\n' +
				'\t<label for="college">College: *</label>\n' +
				'\t<input name="college" id="college" type="text" required>\n' +
				'\t<label for="yearOfMatric">Year of matriculation: *</label>\n' +
				'\t<input name="yearOfMatric" id="yearOfMatric" type="number" required>\n' +
				'\t<label for="notes">Solution notes/comments:</label>\n' +
				'\t<textarea name="notes" id="notes"></textarea>\n' +
				'\n' +
				'\t<button type="submit" disabled>Submit</button>\n' +
				'</form>')
		}
	}
});