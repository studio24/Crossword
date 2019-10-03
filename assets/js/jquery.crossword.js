
/**
 * Jesse Weisbeck's Crossword Puzzle (for all 3 people left who want to play them)
 *
 */

$(document).ready(function(){

	$.fn.crossword = function(entryData) {
		/*
            Qurossword Puzzle: a javascript + jQuery crossword puzzle
            "light" refers to a white box - or an input
            DEV NOTES:
            - activePosition and activeClueIndex are the primary vars that set the ui whenever there's an interaction
            - 'Entry' is a puzzler term used to describe the group of letter inputs representing a word solution
            - This puzzle isn't designed to securely hide answerers. A user can see answerers in the js source
                - An xhr provision can be added later to hit an endpoint on keyup to check the answerer
            - The ordering of the array of problems doesn't matter. The position & orientation properties is enough information
            - Puzzle authors must provide a starting x,y coordinates for each entry
            - Entry orientation must be provided in lieu of provided ending x,y coordinates (script could be adjust to use ending x,y coords)
            - Answers are best provided in lower-case, and can NOT have spaces - will add support for that later
        */

		var puzz = {}; // put data array in object literal to namespace it into safety
		puzz = entryData;

		// append clues markup after puzzle wrapper div
		// This should be moved into a configuration object
		this.after('<div id="puzzle-clues"><h2>Across</h2><ol id="across"></ol><h2>Down</h2><ol id="down"></ol></div>');

		// initialize some variables
		var tbl = ['<table id="puzzle">'],
			puzzEl = this,
			clues = $('#puzzle-clues'),
			clueLiEls,
			coords,
			entryCount = puzz.puzzleData.length,
			entries = [],
			rows = [],
			cols = [],
			solved = [],
			tabindex,
			$actives,
			activePosition = 0,
			activeClueIndex = 0,
			currOri,
			targetInput,
			mode = 'interacting',
			solvedToggle = false,
			z = 0;

		var puzInit = {

			init: function() {
				currOri = 'across'; // app's init orientation could move to config object

				// Reorder the problems array ascending by POSITION
				puzz.puzzleData.sort(function(a,b) {
					return a.position - b.position;
				});

				// Set keyup handlers for the 'entry' inputs that will be added presently
				puzzEl.delegate('input', 'keyup', function(e){
					mode = 'interacting';


					// need to figure out orientation up front, before we attempt to highlight an entry
					switch(e.which) {
						case 39:
						case 37:
							currOri = 'across';
							break;
						case 38:
						case 40:
							currOri = 'down';
							break;
						default:
							break;
					}

					if ( e.keyCode === 9) {
						return false;
					} else if (
						e.keyCode === 37 ||
						e.keyCode === 38 ||
						e.keyCode === 39 ||
						e.keyCode === 40 ||
						e.keyCode === 8 ||
						e.keyCode === 46 ) {



						if (e.keyCode === 8 || e.keyCode === 46) {
							currOri === 'across' ? nav.nextPrevNav(e, 37) : nav.nextPrevNav(e, 38);
						} else {
							nav.nextPrevNav(e);
						}

						e.preventDefault();
						return false;
					} else {

						// console.log('input keyup: '+solvedToggle);

						puzInit.moveToNext(e);

					}

					e.preventDefault();
					return false;
				});

				// tab navigation handler setup
				puzzEl.delegate('input', 'keydown', function(e) {

					if ( e.keyCode === 9) {

						mode = "setting ui";
						if (solvedToggle) solvedToggle = false;

						nav.updateByEntry(e);

					} else {
						return true;
					}

					e.preventDefault();

				});

				// tab navigation handler setup
				puzzEl.delegate('input', 'click', function(e) {
					mode = "setting ui";
					if (solvedToggle) solvedToggle = false;

					// console.log('input click: '+solvedToggle);

					nav.updateByEntry(e);
					e.preventDefault();

				});


				// click/tab clues 'navigation' handler setup
				clues.delegate('li', 'click', function(e) {
					mode = 'setting ui';

					if (!e.keyCode) {
						nav.updateByNav(e);
					}
					e.preventDefault();
				});


				// highlight the letter in selected 'light' - better ux than making user highlight letter with second action
				puzzEl.delegate('#puzzle', 'click', function(e) {
					$(e.target).focus();
					$(e.target).select();
				});

				// DELETE FOR BG
				puzInit.calcCoords();

				// Puzzle clues added to DOM in calcCoords(), so now immediately put mouse focus on first clue
				clueLiEls = $('#puzzle-clues li');
				$('#' + currOri + ' li' ).eq(0).addClass('clues-active').focus();

				// DELETE FOR BG
				puzInit.buildTable();
				puzInit.buildEntries();

			},

			/*
                - Given beginning coordinates, calculate all coordinates for entries, puts them into entries array
                - Builds clue markup and puts screen focus on the first one
            */
			calcCoords: function() {
				/*
                    Calculate all puzzle entry coordinates, put into entries array
                */
				for (var i = 0, p = entryCount; i < p; ++i) {
					// set up array of coordinates for each problem
					entries.push(i);
					entries[i] = [];

					for (var x=0, j = puzz.puzzleData[i].answer.length; x < j; ++x) {
						entries[i].push(x);
						coords = puzz.puzzleData[i].orientation === 'across' ? "" + puzz.puzzleData[i].startx++ + "," + puzz.puzzleData[i].starty + "" : "" + puzz.puzzleData[i].startx + "," + puzz.puzzleData[i].starty++ + "" ;
						entries[i][x] = coords;
					}

					// while we're in here, add clues to DOM!
					$('#' + puzz.puzzleData[i].orientation).append('<li value="' + puzz.puzzleData[i].position + '" tabindex="1" data-position="' + i + '">' + puzz.puzzleData[i].clue + '</li>');
				}

				// Calculate rows/cols by finding max coords of each entry, then picking the highest
				for (var i = 0, p = entryCount; i < p; ++i) {
					for (var x=0; x < entries[i].length; x++) {
						cols.push(entries[i][x].split(',')[0]);
						rows.push(entries[i][x].split(',')[1]);
					};
				}

				rows = Math.max.apply(Math, rows) + "";
				cols = Math.max.apply(Math, cols) + "";

			},

			/*
                Build the table markup
                - adds [data-coords] to each <td> cell
            */
			buildTable: function() {
				for (var i=1; i <= rows; ++i) {
					tbl.push("<tr>");
					for (var x=1; x <= cols; ++x) {
						tbl.push('<td data-coords="' + x + ',' + i + '"></td>');
					};
					tbl.push("</tr>");
				};

				tbl.push("</table>");
				puzzEl.append(tbl.join(''));
			},

			/*
                Builds entries into table
                - Adds entry class(es) to <td> cells
                - Adds tabindexes to <inputs>
            */
			buildEntries: function() {
				var puzzCells = $('#puzzle td'),
					light,
					$groupedLights,
					hasOffset = false,
					positionOffset = entryCount - puzz.puzzleData[puzz.puzzleData.length-1].position; // diff. between total ENTRIES and highest POSITIONS

				for (var x=0, p = entryCount - 1; x <= p; x++) {
					var letters = puzz.puzzleData[x].answer.split('');

					for (var i=0; i < entries[x].length; ++i) {
						light = $('#puzzle td[data-coords="' + entries[x][i] + '"]');

						// check if POSITION property of the entry on current go-round is same as previous.
						// If so, it means there's an across & down entry for the position.
						// Therefore you need to subtract the offset when applying the entry class.
						if(x > 1 ){
							if (puzz.puzzleData[x].position === puzz.puzzleData[x-1].position) {
								hasOffset = true;
							};
						}

						if($(light).empty()){
							$(light)
								.addClass('entry-' + (x) + ' position-' + (x) )
								.append('<input maxlength="1" val="" type="text" tabindex="-1" />');
						}
					};

				};

				// Put entry number in first 'light' of each entry, skipping it if already present
				for (var i=0, p = entryCount; i < p; i++) {
					$groupedLights = $('.entry-' + i);

					if(!$('.entry-' + i +':eq(0) span').length){
						$groupedLights.eq(0)
							.append('<span>' + puzz.puzzleData[i].position + '</span>');
					}
				}

				util.highlightEntry();
				util.highlightClue();
				$('.active').eq(0).focus();
				$('.active').eq(0).select();

			},


			/*
                - Checks current entry input group value against answer
                - If not complete, auto-selects next input for user
            */
			moveToNext: function(e) {
				let complete;

				for(let i = 1; i < $("tr").length + 1; i++){
					for(let j = 1; j < $("tr:first td").length + 1; j++){
						let coord = i + ',' + j;
						if($("[data-coords='" + coord + "'] input").val() === ''){
							complete = false;
							break
						}
						else
							complete = true
					}
				}

				if (complete === true)
					$("[type='submit']").removeAttr("disabled");
				// var valToCheck, currVal;

				util.getActivePositionFromClassGroup($(e.target));

			// 	valToCheck = puzz.puzzleData[activePosition].answer.toLowerCase();
			//
			// 	currVal = $('.position-' + activePosition + ' input')
			// 		.map(function() {
			// 			return $(this)
			// 				.val()
			// 				.toLowerCase();
			// 		})
			// 		.get()
			// 		.join('');
			//
			// 	//console.log(currVal + " " + valToCheck);
			// 	if(valToCheck === currVal){
			// 		$('.active')
			// 			.addClass('done')
			// 			.removeClass('active');
			//
			// 		$('.clues-active').addClass('clue-done');
			//
			// 		solved.push(valToCheck);
			// 		solvedToggle = true;
			// 		return;
			// 	}
			//
				currOri === 'across' ? nav.nextPrevNav(e, 39) : nav.nextPrevNav(e, 40);

				//z++;
				//console.log(z);
				//console.log('checkAnswer() solvedToggle: '+solvedToggle);

			}


		}; // end puzInit object


		var nav = {

			nextPrevNav: function(e, override) {

				var len = $actives.length,
					struck = override ? override : e.which,
					el = $(e.target),
					p = el.parent(),
					ps = el.parents(),
					selector;

				util.getActivePositionFromClassGroup(el);
				util.highlightEntry();
				util.highlightClue();

				$('.current').removeClass('current');

				selector = '.position-' + activePosition + ' input';

				//console.log('nextPrevNav activePosition & struck: '+ activePosition + ' '+struck);

				// move input focus/select to 'next' input
				switch(struck) {
					case 39:
						p
							.next()
							.find('input')
							.addClass('current')
							.select();

						break;

					case 37:
						p
							.prev()
							.find('input')
							.addClass('current')
							.select();

						break;

					case 40:
						ps
							.next('tr')
							.find(selector)
							.addClass('current')
							.select();

						break;

					case 38:
						ps
							.prev('tr')
							.find(selector)
							.addClass('current')
							.select();

						break;

					default:
						break;
				}

			},

			updateByNav: function(e) {
				var target;

				$('.clues-active').removeClass('clues-active');
				$('.active').removeClass('active');
				$('.current').removeClass('current');
				currIndex = 0;

				target = e.target;
				activePosition = $(e.target).data('position');

				util.highlightEntry();
				util.highlightClue();

				$('.active').eq(0).focus();
				$('.active').eq(0).select();
				$('.active').eq(0).addClass('current');

				// store orientation for 'smart' auto-selecting next input
				currOri = $('.clues-active').parent('ol').prop('id');

				activeClueIndex = $(clueLiEls).index(e.target);
				//console.log('updateByNav() activeClueIndex: '+activeClueIndex);

			},

			// Sets activePosition var and adds active class to current entry
			updateByEntry: function(e, next) {
				var classes, next, clue, e1Ori, e2Ori, e1Cell, e2Cell;

				if(e.keyCode === 9 || next){
					// handle tabbing through problems, which keys off clues and requires different handling
					activeClueIndex = activeClueIndex === clueLiEls.length-1 ? 0 : ++activeClueIndex;

					$('.clues-active').removeClass('.clues-active');

					next = $(clueLiEls[activeClueIndex]);
					currOri = next.parent().prop('id');
					activePosition = $(next).data('position');

					// skips over already-solved problems
					util.getSkips(activeClueIndex);
					activePosition = $(clueLiEls[activeClueIndex]).data('position');


				} else {
					activeClueIndex = activeClueIndex === clueLiEls.length-1 ? 0 : ++activeClueIndex;

					util.getActivePositionFromClassGroup(e.target);

					clue = $('#puzzle-clues li' + '[data-position=' + activePosition + ']');
					activeClueIndex = $(clueLiEls).index(clue);

					currOri = clue.parent().prop('id');

				}

				util.highlightEntry();
				util.highlightClue();

				//$actives.eq(0).addClass('current');
				//console.log('nav.updateByEntry() reports activePosition as: '+activePosition);
			}

		}; // end nav object


		var util = {
			highlightEntry: function() {
				// this routine needs to be smarter because it doesn't need to fire every time, only
				// when activePosition changes
				$actives = $('.active');
				$actives.removeClass('active');
				$actives = $('.position-' + activePosition + ' input').addClass('active');
				$actives.eq(0).focus();
				$actives.eq(0).select();
			},

			highlightClue: function() {
				var clue;
				$('.clues-active').removeClass('clues-active');
				$('#puzzle-clues li' + '[data-position=' + activePosition + ']').addClass('clues-active');

				if (mode === 'interacting') {
					clue = $('#puzzle-clues li' + '[data-position=' + activePosition + ']');
					activeClueIndex = $(clueLiEls).index(clue);
				};
			},

			getClasses: function(light, type) {
				if (!light.length) return false;

				var classes = $(light).prop('class').split(' '),
					classLen = classes.length,
					positions = [];

				// pluck out just the position classes
				for(var i=0; i < classLen; ++i){
					if (!classes[i].indexOf(type) ) {
						positions.push(classes[i]);
					}
				}

				return positions;
			},

			getActivePositionFromClassGroup: function(el){

				classes = util.getClasses($(el).parent(), 'position');

				if(classes.length > 1){
					// get orientation for each reported position
					e1Ori = $('#puzzle-clues li' + '[data-position=' + classes[0].split('-')[1] + ']').parent().prop('id');
					e2Ori = $('#puzzle-clues li' + '[data-position=' + classes[1].split('-')[1] + ']').parent().prop('id');

					// test if clicked input is first in series. If so, and it intersects with
					// entry of opposite orientation, switch to select this one instead
					e1Cell = $('.position-' + classes[0].split('-')[1] + ' input').index(el);
					e2Cell = $('.position-' + classes[1].split('-')[1] + ' input').index(el);

					if(mode === "setting ui"){
						currOri = e1Cell === 0 ? e1Ori : e2Ori; // change orientation if cell clicked was first in a entry of opposite direction
					}

					if(e1Ori === currOri){
						activePosition = classes[0].split('-')[1];
					} else if(e2Ori === currOri){
						activePosition = classes[1].split('-')[1];
					}
				} else {
					activePosition = classes[0].split('-')[1];
				}

				// console.log('getActivePositionFromClassGroup activePosition: '+activePosition);

			},

			checkSolved: function(valToCheck) {
				for (var i=0, s=solved.length; i < s; i++) {
					if(valToCheck === solved[i]){
						return true;
					}

				}
			},

			getSkips: function(position) {
				if ($(clueLiEls[position]).hasClass('clue-done')){
					activeClueIndex = position === clueLiEls.length-1 ? 0 : ++activeClueIndex;
					util.getSkips(activeClueIndex);
				} else {
					return false;
				}
			}

		}; // end util object


		puzInit.init();

		restoreCrossword();
		showButtons();

		$("#showSolution").click(showSolution);
		$("#save").click(save);
		$("#check").click(checkAnswer);
		$("[type='submit']").click(submit);

		function showSolution(){

			for(let i = 0; i<puzz.puzzleData.length; i++){
				// console.log($("td").hasClass('position-' + i));

				let word = puzz.puzzleData[i].answer;
				let firstCoord = $(".position-" + i).attr('data-coords');

				for(let j = 0; j < word.length; j++){
					let newCoord;

					if (puzz.puzzleData[i].orientation === 'across'){
						let xCoord = parseInt(firstCoord.substr(0, firstCoord.indexOf(','))) + j;
						newCoord = xCoord + firstCoord.substr(firstCoord.indexOf(','));
					}
					else {
						let yCoord = parseInt(firstCoord.substr(firstCoord.indexOf(',') + 1)) + j;
						newCoord = firstCoord.substr(0, firstCoord.indexOf(',') + 1) + yCoord;
					}

					$("[data-coords='" + newCoord + "'].position-" + i + " input").val(word.substr(j, 1));
				}
			}
		}
		
		function save() {
			let crossword = [];

			for(let i = 1; i < $("tr").length + 1; i++){
				crossword[i] = [];
				for(let j = 1; j < $("tr:first td").length + 1; j++){
					let coord = i + ',' + j;
					crossword[i][j] = $("[data-coords='" + coord + "'] input").val();
				}
			}

			localStorage.setItem(puzz.magazineNr + '-' + puzz.crosswordNr, JSON.stringify(crossword));
		}
		
		function restoreCrossword() {
			if (localStorage.getItem(puzz.magazineNr + '-' + puzz.crosswordNr) !== null) {
				let crossword = JSON.parse(localStorage.getItem(puzz.magazineNr + '-' + puzz.crosswordNr));

				for(let i = 1; i < $("tr").length + 1; i++){
					for(let j = 1; j < $("tr:first td").length + 1; j++){
						let coord = i + ',' + j;
						$("[data-coords='" + coord + "'] input").val(crossword[i][j])
					}
				}
			}
		}

		function checkAnswer() {
			for(let i = 0; i<puzz.puzzleData.length; i++){

				valToCheck = puzz.puzzleData[i].answer.toLowerCase();

				currVal = $('.position-' + i + ' input')
					.map(function() {
						return $(this)
							.val()
							.toLowerCase();
					})
					.get()
					.join('');

				//console.log(currVal + " " + valToCheck);
				if(valToCheck !== currVal){
					alert("puzzle not solved");
					return;
				}
			}

			alert("you solved the puzzle");
		}

		function submit(e) {
		    e.preventDefault();

			let crossword = [];

			for(let i = 1; i < $("tr").length + 1; i++){
				crossword[i] = [];
				for(let j = 1; j < $("tr:first td").length + 1; j++){
					let coord = i + ',' + j;
					crossword[i][j] = $("[data-coords='" + coord + "'] input").val();
				}
			}

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
                    console.log(data);
                }
			});
		}

		function showButtons() {
            $("body").append("<button id='save'>Save</button>");

            if (puzz.current){
                $("body").append('<form method="post" >\n' +
                    '\t<label for="alumniNr">Alumni number:</label>\n' +
                    '\t<input name="alumniNr" id="alumniNr" type="number">\n' +
                    '\t<label for="name">Name:</label>\n' +
                    '\t<input name="name" id="name" type="text" required>\n' +
                    '\t<label for="email">Email:</label>\n' +
                    '\t<input name="email" id="email" type="email" required>\n' +
                    '\t<label for="college">College:</label>\n' +
                    '\t<input name="college" id="college" type="text" required>\n' +
                    '\t<label for="yearOfMatric">Year of matriculation: *</label>\n' +
                    '\t<input name="yearOfMatric" id="yearOfMatric" type="number">\n' +
                    '\t<label for="notes">Solution notes/comments:</label>\n' +
                    '\t<textarea name="notes" id="notes"></textarea>\n' +
                    '\n' +
                    '\t<button type="submit" disabled>Submit</button>\n' +
                    '</form>')
            } else {
                $("body").append('<button id="showSolution">Show solution</button>\n' +
                    '<button id="check">Check answer</button>');
            }
        }
	}
});