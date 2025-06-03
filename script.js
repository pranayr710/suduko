/**
 * Sudoku Game Implementation
 * A complete Sudoku game with multiple difficulty levels, hints, and statistics tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // DOM Elements
    // =========================================================================
    const boardElement = document.getElementById('sudoku-board');
    const newGameBtn = document.getElementById('new-game-btn');
    const resetBtn = document.getElementById('reset-btn');
    const hintBtn = document.getElementById('hint-btn');
    const hintCountElement = document.getElementById('hint-count');
    const checkSolutionBtn = document.getElementById('check-solution-btn');
    const difficultySelector = document.getElementById('difficulty');
    const messageArea = document.getElementById('message-area');
    const timerElement = document.getElementById('timer');
    const puzzlesSolvedElement = document.getElementById('puzzles-solved');
    const fastestTimeElement = document.getElementById('fastest-time');
    const totalTimePlayedElement = document.getElementById('total-time-played');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Modal Elements
    const resetModal = document.getElementById('reset-modal');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const closeResetModalBtn = document.getElementById('close-reset-modal');

    const resetStatsModal = document.getElementById('reset-stats-modal');
    const confirmResetStatsBtn = document.getElementById('confirm-reset-stats-btn');
    const cancelResetStatsBtn = document.getElementById('cancel-reset-stats-btn');
    const closeResetStatsModalBtn = document.getElementById('close-reset-stats-modal');

    // =========================================================================
    // Game State Variables
    // =========================================================================
    let currentBoard = []; // Represents the 9x9 board, 0 for empty
    let solutionBoard = []; // The solved version of the currentBoard
    let initialBoard = []; // The board with pre-filled numbers, for reset
    let difficulty = 'medium';
    let timerInterval;
    let secondsElapsed = 0;
    let hintsRemaining = 3;
    let stats = {
        puzzlesSolved: 0,
        fastestTime: { easy: Infinity, medium: Infinity, hard: Infinity, expert: Infinity },
        totalTimePlayed: 0
    };
    let currentFocus = { row: 0, col: 0 };

    // =========================================================================
    // Constants
    // =========================================================================
    const EMPTY_CELL = 0;
    const GRID_SIZE = 9;
    const SUBGRID_SIZE = 3;
    const DIFFICULTY_LEVELS = {
        easy: 45,   // Number of cells to fill (approx)
        medium: 40,
        hard: 30,
        expert: 22
    };

    // =========================================================================
    // Core Sudoku Logic
    // =========================================================================

    /**
     * Shuffles an array in place using Fisher-Yates algorithm.
     * @param {Array} array - Array to shuffle
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Checks if a number can be placed at a given position.
     * @param {Array<Array<number>>} board - The Sudoku board
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @returns {boolean} True if valid, false otherwise
     */
    function isValidPlacement(board, row, col, num) {
        // Check row
        for (let x = 0; x < GRID_SIZE; x++) {
            if (board[row][x] === num) return false;
        }
        // Check column
        for (let x = 0; x < GRID_SIZE; x++) {
            if (board[x][col] === num) return false;
        }
        // Check 3x3 subgrid
        const startRow = row - row % SUBGRID_SIZE;
        const startCol = col - col % SUBGRID_SIZE;
        for (let i = 0; i < SUBGRID_SIZE; i++) {
            for (let j = 0; j < SUBGRID_SIZE; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    /**
     * Solves the Sudoku puzzle using backtracking algorithm.
     * @param {Array<Array<number>>} board - The Sudoku board
     * @returns {boolean} True if a solution is found, false otherwise
     */
    function solveSudoku(board) {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (board[row][col] === EMPTY_CELL) {
                    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    shuffleArray(numbers); // Introduce randomness for different valid boards
                    for (let num of numbers) {
                        if (isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            if (solveSudoku(board)) {
                                return true;
                            }
                            board[row][col] = EMPTY_CELL; // Backtrack
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Counts the number of solutions for a given Sudoku puzzle.
     * @param {Array<Array<number>>} board - The Sudoku puzzle
     * @returns {number} The number of solutions found
     */
    let solutionCount;
    function countSolutions(board) {
        solutionCount = 0;
        _solveAndCount(board);
        return solutionCount;
    }

    /**
     * Helper function for countSolutions that recursively finds all solutions.
     * @param {Array<Array<number>>} board - The Sudoku puzzle
     */
    function _solveAndCount(board) {
        if (solutionCount > 1) return; // Stop if more than one solution is found

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (board[row][col] === EMPTY_CELL) {
                    for (let num = 1; num <= GRID_SIZE; num++) {
                        if (isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            _solveAndCount(board);
                            board[row][col] = EMPTY_CELL; // Backtrack
                            if (solutionCount > 1) return;
                        }
                    }
                    return;
                }
            }
        }
        solutionCount++;
    }

    /**
     * Generates a new Sudoku puzzle.
     * @param {string} level - Difficulty level ('easy', 'medium', 'hard', 'expert')
     * @returns {{puzzle: Array<Array<number>>, solution: Array<Array<number>>}} Puzzle and its solution
     */
    function generatePuzzle(level) {
        // Create an empty board
        let board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(EMPTY_CELL));

        // Generate a full solution
        solveSudoku(board);
        let solvedBoard = JSON.parse(JSON.stringify(board)); // Deep copy

        // Remove numbers to create the puzzle
        let cellsToRemove = GRID_SIZE * GRID_SIZE - DIFFICULTY_LEVELS[level];
        let cellPositions = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                cellPositions.push({ r, c });
            }
        }
        shuffleArray(cellPositions);

        let removedCount = 0;
        for (let pos of cellPositions) {
            if (removedCount >= cellsToRemove) break;

            let r = pos.r;
            let c = pos.c;

            if (board[r][c] !== EMPTY_CELL) {
                let temp = board[r][c];
                board[r][c] = EMPTY_CELL;
                
                let tempBoardForCounting = JSON.parse(JSON.stringify(board));
                let numSolutions = countSolutions(tempBoardForCounting);

                if (numSolutions === 1) {
                    removedCount++;
                } else {
                    board[r][c] = temp; // Put it back if not unique
                }
            }
        }

        return { puzzle: board, solution: solvedBoard };
    }

    // =========================================================================
    // UI Rendering and Interaction
    // =========================================================================

    /**
     * Renders the Sudoku board in the DOM.
     * @param {Array<Array<number>>} boardData - The puzzle data
     * @param {Array<Array<number>>} initialPuzzleData - The initial pre-filled puzzle data
     */
    function renderBoard(boardData, initialPuzzleData) {
        boardElement.innerHTML = '';
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('sudoku-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Add classes for thick borders (3x3 subgrids)
                if ((r + 1) % SUBGRID_SIZE === 0 && r < GRID_SIZE - 1) {
                    cell.classList.add('border-bottom-thick');
                }
                if ((c + 1) % SUBGRID_SIZE === 0 && c < GRID_SIZE - 1) {
                    cell.classList.add('border-right-thick');
                }

                const input = document.createElement('input');
                input.type = 'number';
                input.maxLength = 1;
                input.dataset.row = r;
                input.dataset.col = c;

                if (initialPuzzleData[r][c] !== EMPTY_CELL) {
                    input.value = initialPuzzleData[r][c];
                    input.disabled = true;
                } else if (boardData[r][c] !== EMPTY_CELL) {
                    input.value = boardData[r][c];
                }

                input.addEventListener('input', handleCellInput);
                input.addEventListener('keydown', handleCellKeyDown);
                input.addEventListener('focus', () => {
                    currentFocus = { row: r, col: c };
                    clearHighlights();
                });

                cell.appendChild(input);
                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Handles input in a cell.
     * @param {Event} event - The input event
     */
    function handleCellInput(event) {
        const input = event.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        let value = parseInt(input.value) || EMPTY_CELL;

        // Validate input
        if (value < 0 || value > 9) {
            value = EMPTY_CELL;
            input.value = '';
        }

        currentBoard[row][col] = value;
        clearHighlights();

        if (value !== EMPTY_CELL) {
            highlightConflicts(row, col, value, true);
        }

        if (isBoardFull()) {
            checkSolutionLogic();
        }
    }

    /**
     * Handles keyboard navigation and input.
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handleCellKeyDown(event) {
        const input = event.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                if (row > 0) focusCell(row - 1, col);
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (row < GRID_SIZE - 1) focusCell(row + 1, col);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (col > 0) focusCell(row, col - 1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (col < GRID_SIZE - 1) focusCell(row, col + 1);
                break;
            case 'Backspace':
            case 'Delete':
                if (input.value) {
                    input.value = '';
                    currentBoard[row][col] = EMPTY_CELL;
                    clearHighlights();
                }
                break;
        }
    }

    /**
     * Focuses a cell and highlights it.
     * @param {number} row - Row index
     * @param {number} col - Column index
     */
    function focusCell(row, col) {
        const cell = boardElement.querySelector(`[data-row="${row}"][data-col="${col}"] input`);
        if (cell && !cell.disabled) {
            cell.focus();
            currentFocus = { row, col };
        }
    }

    /**
     * Highlights conflicts in the board.
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {number} num - Number to check
     * @param {boolean} isUserInput - Whether this is from user input
     */
    function highlightConflicts(row, col, num, isUserInput) {
        if (num === EMPTY_CELL) return;

        const cells = boardElement.querySelectorAll('.sudoku-cell');
        let hasConflict = false;

        // Check row
        for (let c = 0; c < GRID_SIZE; c++) {
            if (c !== col && currentBoard[row][c] === num) {
                cells[row * GRID_SIZE + c].classList.add('invalid');
                hasConflict = true;
            }
        }

        // Check column
        for (let r = 0; r < GRID_SIZE; r++) {
            if (r !== row && currentBoard[r][col] === num) {
                cells[r * GRID_SIZE + col].classList.add('invalid');
                hasConflict = true;
            }
        }

        // Check 3x3 subgrid
        const startRow = row - row % SUBGRID_SIZE;
        const startCol = col - col % SUBGRID_SIZE;
        for (let r = startRow; r < startRow + SUBGRID_SIZE; r++) {
            for (let c = startCol; c < startCol + SUBGRID_SIZE; c++) {
                if (r !== row && c !== col && currentBoard[r][c] === num) {
                    cells[r * GRID_SIZE + c].classList.add('invalid');
                    hasConflict = true;
                }
            }
        }

        if (hasConflict && isUserInput) {
            cells[row * GRID_SIZE + col].classList.add('invalid');
        }
    }

    /**
     * Clears all highlights from the board.
     */
    function clearHighlights() {
        const cells = boardElement.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => cell.classList.remove('invalid'));
    }

    /**
     * Displays a message to the user.
     * @param {string} msg - Message to display
     * @param {string} type - Message type ('success', 'error', 'info')
     */
    function displayMessage(msg, type = 'info') {
        messageArea.textContent = msg;
        messageArea.className = `message ${type}`;
    }

    // =========================================================================
    // Game Control Functions
    // =========================================================================

    /**
     * Starts a new game.
     */
    function startNewGame() {
        const { puzzle, solution } = generatePuzzle(difficulty);
        currentBoard = JSON.parse(JSON.stringify(puzzle));
        solutionBoard = solution;
        initialBoard = JSON.parse(JSON.stringify(puzzle));
        
        renderBoard(currentBoard, initialBoard);
        resetTimer();
        startTimer();
        hintsRemaining = 3;
        updateHintButton();
        displayMessage('New game started!', 'info');
    }

    /**
     * Resets the current game to its initial state.
     */
    function resetCurrentGame() {
        currentBoard = JSON.parse(JSON.stringify(initialBoard));
        renderBoard(currentBoard, initialBoard);
        resetTimer();
        startTimer();
        hintsRemaining = 3;
        updateHintButton();
        displayMessage('Game reset!', 'info');
    }

    /**
     * Checks if the current solution is correct.
     * @param {boolean} showMessage - Whether to show a message
     * @returns {boolean} True if correct, false otherwise
     */
    function checkSolutionLogic(showMessage = true) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentBoard[r][c] !== solutionBoard[r][c]) {
                    if (showMessage) {
                        displayMessage('Solution is incorrect. Keep trying!', 'error');
                    }
                    return false;
                }
            }
        }
        if (showMessage) {
            handleGameWin();
        }
        return true;
    }

    /**
     * Handles the game win condition.
     */
    function handleGameWin() {
        stopTimer();
        displayMessage('Congratulations! You solved the puzzle!', 'success');
        updateStatsOnWin();
    }

    /**
     * Checks if the board is full.
     * @returns {boolean} True if full, false otherwise
     */
    function isBoardFull() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentBoard[r][c] === EMPTY_CELL) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Provides a hint to the user.
     */
    function provideHint() {
        if (hintsRemaining <= 0) {
            displayMessage('No hints remaining!', 'error');
            return;
        }

        // Find an empty or incorrect cell
        let emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (currentBoard[r][c] !== solutionBoard[r][c]) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }

        if (emptyCells.length === 0) {
            displayMessage('No hints needed - you\'re doing great!', 'info');
            return;
        }

        // Randomly select an empty cell
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const { row, col } = randomCell;

        // Update the cell
        currentBoard[row][col] = solutionBoard[row][col];
        const input = boardElement.querySelector(`[data-row="${row}"][data-col="${col}"] input`);
        input.value = solutionBoard[row][col];

        // Highlight the cell
        const cell = input.parentElement;
        cell.classList.add('hinted');
        setTimeout(() => cell.classList.remove('hinted'), 1000);

        hintsRemaining--;
        updateHintButton();
        displayMessage('Hint provided!', 'info');

        if (isBoardFull()) {
            checkSolutionLogic();
        }
    }

    /**
     * Updates the hint button display.
     */
    function updateHintButton() {
        hintCountElement.textContent = `(${hintsRemaining})`;
        hintBtn.disabled = hintsRemaining <= 0;
    }

    // =========================================================================
    // Timer Functions
    // =========================================================================

    /**
     * Starts the game timer.
     */
    function startTimer() {
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    /**
     * Stops the game timer.
     */
    function stopTimer() {
        clearInterval(timerInterval);
    }

    /**
     * Resets the game timer.
     */
    function resetTimer() {
        secondsElapsed = 0;
        updateTimerDisplay();
    }

    /**
     * Updates the timer display.
     */
    function updateTimerDisplay() {
        const minutes = Math.floor(secondsElapsed / 60);
        const seconds = secondsElapsed % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Formats total time played.
     * @param {number} totalSeconds - Total seconds played
     * @returns {string} Formatted time string
     */
    function formatTotalTimePlayed(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // =========================================================================
    // Statistics Functions
    // =========================================================================

    /**
     * Loads statistics from localStorage.
     */
    function loadStats() {
        const savedStats = localStorage.getItem('sudokuStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
            updateStatsDisplay();
        }
    }

    /**
     * Saves statistics to localStorage.
     */
    function saveStats() {
        localStorage.setItem('sudokuStats', JSON.stringify(stats));
    }

    /**
     * Updates statistics when the game is won.
     */
    function updateStatsOnWin() {
        stats.puzzlesSolved++;
        if (secondsElapsed < stats.fastestTime[difficulty]) {
            stats.fastestTime[difficulty] = secondsElapsed;
        }
        stats.totalTimePlayed += secondsElapsed;
        saveStats();
        updateStatsDisplay();
    }

    /**
     * Resets all statistics.
     */
    function resetAllStats() {
        stats = {
            puzzlesSolved: 0,
            fastestTime: { easy: Infinity, medium: Infinity, hard: Infinity, expert: Infinity },
            totalTimePlayed: 0
        };
        saveStats();
        updateStatsDisplay();
        displayMessage('Statistics reset!', 'info');
    }

    /**
     * Updates the statistics display.
     */
    function updateStatsDisplay() {
        puzzlesSolvedElement.textContent = stats.puzzlesSolved;
        fastestTimeElement.textContent = stats.fastestTime.medium === Infinity ? 
            'N/A' : 
            `${Math.floor(stats.fastestTime.medium / 60)}:${(stats.fastestTime.medium % 60).toString().padStart(2, '0')}`;
        totalTimePlayedElement.textContent = formatTotalTimePlayed(stats.totalTimePlayed);
    }

    // =========================================================================
    // Theme Functions
    // =========================================================================

    /**
     * Applies the selected theme.
     * @param {string} theme - Theme to apply ('light' or 'dark')
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // =========================================================================
    // Modal Functions
    // =========================================================================

    /**
     * Opens a modal.
     * @param {HTMLElement} modalElement - The modal element to open
     */
    function openModal(modalElement) {
        modalElement.style.display = 'flex';
    }

    /**
     * Closes a modal.
     * @param {HTMLElement} modalElement - The modal element to close
     */
    function closeModal(modalElement) {
        modalElement.style.display = 'none';
    }

    // =========================================================================
    // Event Listeners
    // =========================================================================

    // Game control buttons
    newGameBtn.addEventListener('click', startNewGame);
    resetBtn.addEventListener('click', () => openModal(resetModal));
    hintBtn.addEventListener('click', provideHint);
    checkSolutionBtn.addEventListener('click', () => checkSolutionLogic(true));
    difficultySelector.addEventListener('change', (e) => {
        difficulty = e.target.value;
        startNewGame();
    });

    // Modal buttons
    confirmResetBtn.addEventListener('click', () => {
        closeModal(resetModal);
        resetCurrentGame();
    });
    cancelResetBtn.addEventListener('click', () => closeModal(resetModal));
    closeResetModalBtn.addEventListener('click', () => closeModal(resetModal));

    confirmResetStatsBtn.addEventListener('click', () => {
        closeModal(resetStatsModal);
        resetAllStats();
    });
    cancelResetStatsBtn.addEventListener('click', () => closeModal(resetStatsModal));
    closeResetStatsModalBtn.addEventListener('click', () => closeModal(resetStatsModal));

    resetStatsBtn.addEventListener('click', () => openModal(resetStatsModal));

    // Theme toggle
    themeToggle.addEventListener('change', (e) => {
        applyTheme(e.target.checked ? 'dark' : 'light');
    });

    // =========================================================================
    // Initialization
    // =========================================================================

    /**
     * Initializes the game.
     */
    function init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        themeToggle.checked = savedTheme === 'dark';
        applyTheme(savedTheme);

        // Load statistics
        loadStats();

        // Start first game
        startNewGame();
    }

    // Start the game
    init();
});