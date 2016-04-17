(function() {
    "use strict";
    $(document).ready(function(){
        var $quizSelection = $("#quizSelection"),
            $quizBox = $("#quizBox"),
            $networkError = $(".network-error"),
            $modalTemplate = $("#modal-template"),
            $highScoreModal = $("#highscoreModal"),
            $navPills = $highScoreModal.find(".modal-header").find("a"),
            chosenAnswer,
            quizData,
            undefined = [][0];

        $( "a.quiz-select" ).click( function( event ) {
            var data = $(this).data('quiz');
            event.preventDefault();
            $.post( "/quiz-select", {'data': data} )
                .done( function( data ) {
                    if(data.error || !data.questionsAndAnswers || !data.questionsAndAnswers.length) {
                        data.message = data.message || "invalid response";
                        data.subMessage = data.subMessage || "Unfortunately the response somehow malformed, sorry for the inconveniences";
                        invalidRequest(data.message, data.subMessage);
                        return;
                    }
                    quizData = data;
                    wipeQuizData();
                    showQuizBox(data);
                })
                .fail( function() {
                    showNetworkError();
                });
        });

        $navPills.click( function (event) {
            event.preventDefault();
            $navPills.parent().removeClass("active");
            $(this).parent().addClass("active");
        });

        $( ".show-high-score" ).click( function( event ) {
            event.preventDefault();
            showHighScore();
        });

        $( ".update-quizzes" ).click( function( event ) {
            $.post( "/updateQuizzes" )
                .done( function( data ) {
                    console.log(data);
                })
                .fail( function() {
                    showNetworkError();
                });
        });

        $quizBox.find(".well").click( function( event ) {
            $quizBox.find(".well").removeClass("selected");
            $(this).addClass("selected");
            chosenAnswer = $(this).data("answer-index")+"";
        });

        $( ".submit" ).click( function() {
            if(!chosenAnswer) {
                $quizBox.find(".well").addClass("hovered");
                setTimeout(function(){ $quizBox.find(".well").removeClass("hovered"); }, 2500);
                return;
            }

            $.post( "/submit", {'data': chosenAnswer} )
                .done( function( data ) {
                    showVolatileScoreUp(data);
                    updateScore(data);
                    handleNextRound(data);
                })
                .fail( function() {
                    showNetworkError();
                })
                .always( function() {
                    chosenAnswer = undefined;
                });
        });

        $( ".give-up" ).click( function() {
            $.post( "/submit", {'data': ""} )
                .done( function( data ) {
                    handleNextRound(data);
                })
                .fail( function() {
                    showNetworkError()
                });
        });

        $( ".exit-anyway" ).click( function() {
            exitToQuizzes();
        });

        function invalidRequest(message, subMessage) {
            $modalTemplate.find(".modal-title").text(message);
            if (subMessage) { $modalTemplate.find(".modal-body").text(subMessage); }
            $modalTemplate.modal('show');
        }

        function showQuizBox(data, questionIndex) {
            questionIndex = questionIndex || "0";
            if (!data.questionsAndAnswers[questionIndex]) {
                showHighScore(data.name);
                exitToQuizzes();
                return;
            }
            $quizBox.find(".well").removeClass("hidden");
            $quizBox.find(".well").removeClass("selected");
            $quizBox.find(".question").text(data.questionsAndAnswers[questionIndex].question);
            if (data.questionsAndAnswers[questionIndex].answers[0].answerText)  {
                $quizBox.find(".answer-a").text(data.questionsAndAnswers[questionIndex].answers[0].answerText);
            } else {
                $quizBox.find(".answer-a").parents(".well").addClass("hidden");
            }
            if (data.questionsAndAnswers[questionIndex].answers[1].answerText)  {
                $quizBox.find(".answer-b").text(data.questionsAndAnswers[questionIndex].answers[1].answerText);
            } else {
                $quizBox.find(".answer-b").parents(".well").addClass("hidden");
            }
            if (data.questionsAndAnswers[questionIndex].answers[2].answerText)  {
                $quizBox.find(".answer-c").text(data.questionsAndAnswers[questionIndex].answers[2].answerText);
            } else {
                $quizBox.find(".answer-c").parents(".well").addClass("hidden");
            }
            if (data.questionsAndAnswers[questionIndex].answers[3].answerText)  {
                $quizBox.find(".answer-d").text(data.questionsAndAnswers[questionIndex].answers[3].answerText);
            } else {
                $quizBox.find(".answer-d").parents(".well").addClass("hidden");
            }
            $quizSelection.addClass("hidden");
            $quizBox.removeClass("hidden");
        }
        function handleNextRound(data) {
            if (data.gameFinished) {
                showHighScore(data.name || "all");
                exitToQuizzes();
            } else {
                updateQuizBox(data);
            }
        }

        function updateQuizBox(data) {
            showQuizBox(quizData, data.questionIndex);
        }

        function updateScore(data) {
            let $userScore = $(".user-score");
            $userScore.text(Number($userScore.text()) + Number(data.scoreUp));
        }

        function showVolatileScoreUp(data) {
            let $volatileScore = $(".volatile-score");
            $volatileScore
                .text(Number(data.scoreUp))
                .removeClass("hidden")
                .css({opacity: "1", fontSize: "1em", bottom: "0"})
                .animate( {
                    //width: "300%",
                    opacity: 0.0,
                    fontSize: "3em",
                    bottom: "100px"
                }, 1500);
        }

        function showHighScore(higscoreTable) {
            higscoreTable = higscoreTable || "all";
            $.post( "/show-high-score", {'data': higscoreTable} )
                .done( function( data ) {
                    if(data.error) {
                        data.message = data.message || "invalid response";
                        data.subMessage = data.subMessage || "Unfortunately the response somehow malformed, sorry for the inconveniences";
                        invalidRequest(data.message, data.subMessage);
                        return;
                    }
                    fillScoreTabs(data);
                    activateScoreTab(data.title);
                })
                .fail( function() {
                    showNetworkError();
                });
        }

        function fillScoreTabs(data) {
            if (!data.scores) return;

            let $scoreModalBody = $highScoreModal.find(".modal-body");
            let scoresTitleRow =
                "<div class='score-row'>" +
                "<div class='score-item'>player</div>" +
                "<div class='score-item'>quiz</div>" +
                "<div class='score-item'>date</div>" +
                "<div class='score-item'>score</div>" +
                "</div>";
            let scores = "";
            for (let score of data.scores) {
                scores +=
                    "<div class='score-row'>" +
                    "<div class='score-item'>" + score.user + "</div>" +
                    "<div class='score-item'>" + score.quizName + "</div>" +
                    "<div class='score-item'>" + formatDate(score.date) + "</div>" +
                    "<div class='score-item'>" + score.score + "</div>" +
                    "</div>";
            }

            $scoreModalBody.html(scoresTitleRow + scores);
            $highScoreModal.modal('show');
        }

        function formatDate(scoreDate) {
            return (scoreDate.slice(0, 10) + " " + scoreDate.slice(11, 16));
        }

        function activateScoreTab(title) {
            if (!title) return;

            $navPills.parent().removeClass("active");
            switch(title) {
                case "all":
                    $navPills.filter("[data-request='all']").parent().addClass("active");
                    break;
                case "own":
                    $navPills.filter("[data-request='own']").parent().addClass("active");
                    break;
                default:
                    $navPills.filter("[data-request='per-quiz']").parent().addClass("active");
                    break;
            }
        }

        function showNetworkError() {
            $networkError.removeClass("hidden");
            setTimeout(function(){ $networkError.addClass("hidden"); }, 2500);
        }

        function exitToQuizzes() {
            $quizSelection.removeClass("hidden");
            $quizBox.addClass("hidden");
        }

        function wipeQuizData() {
            let $userScore = $(".user-score");
            $userScore.text(0);
        }

    });
})();
