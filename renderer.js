const PC_NAME = "PC-01";

const loginButton = document.getElementById("loginButton");

const customerIdInput = document.getElementById("customerId");
const passwordInput = document.getElementById("password");

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");

const customerName = document.getElementById("customerName");
const pcName = document.getElementById("pcName");
const loginTime = document.getElementById("loginTime");

const sessionDuration = document.getElementById("sessionDuration");

const logoutButton = document.getElementById("logoutButton");

const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function() {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";
        togglePassword.textContent = "HIDE";

    } else {

        passwordInput.type = "password";
        togglePassword.textContent = "SHOW";

    }

});

let timer;
let startTime;
let loggedIn = false;


// =========================
// LOGIN
// =========================

loginButton.addEventListener("click", async function() {

    console.log("1. Button clicked");

    const customerId = customerIdInput.value;
    const password = passwordInput.value;

    try {

        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                customer_id: customerId,
                password: password,
                pc_name: PC_NAME
            })
        });
        console.log("2. Login request sent");

        const result = await response.json();


        if (result.success) {
            loggedIn = true;

            // Hide login screen
            loginScreen.style.display = "none";

            // Show dashboard
            dashboard.style.display = "block";

            // Put Flask data into dashboard
            customerName.textContent =
                result.message.replace("Welcome, ", "");

            pcName.textContent = result.pc_name;


            // =========================
            // START TIMER
            // =========================

            startTime = new Date(
                result.login_time.replace(" ", "T")
            );

            timer = setInterval(function() {

                const now = new Date();

                const difference = now - startTime;

                const totalSeconds =
                    Math.floor(difference / 1000);

                const hours =
                    Math.floor(totalSeconds / 3600);

                const minutes =
                    Math.floor((totalSeconds % 3600) / 60);

                const seconds =
                    totalSeconds % 60;


                sessionDuration.textContent =
                    String(hours).padStart(2, "0") + ":" +
                    String(minutes).padStart(2, "0") + ":" +
                    String(seconds).padStart(2, "0");

            }, 1000);


        } else {

            alert(result.message);

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }

});


// =========================
// LOGOUT
// =========================

logoutButton.addEventListener("click", async function() {

    loggedIn = false;

    const customerId = customerIdInput.value;

    try {

        const response = await fetch("http://127.0.0.1:5000/logout", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                customer_id: customerId
            })
        });

        const result = await response.json();


        if (result.success) {

            loggedIn = false;



            // Stop timer
            clearInterval(timer);

            alert(
                result.message +
                "\nLogout Time: " + result.logout_time +
                "\nSession Duration: " + result.duration
            );


            // Return to login screen
            dashboard.style.display = "none";

            loginScreen.style.display = "block";


            // Clear password
            passwordInput.value = "";


            // Reset timer
            sessionDuration.textContent = "00:00:00";

        } else {

            alert(result.message);

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }

});

/// =========================
// CHECK SESSION STATUS
// =========================

setInterval(async function() {

    if (!loggedIn) {
        return;
    }

    const customerId = customerIdInput.value;

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/session-status",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    customer_id: customerId
                })
            }
        );

        const result = await response.json();

        if (!result.active) {

            // Customer was force logged out
            loggedIn = false;

            // Stop the timer
            clearInterval(timer);

            // Return to login screen
            dashboard.style.display = "none";
            loginScreen.style.display = "block";

            // Clear password
            passwordInput.value = "";

            // Reset timer
            sessionDuration.textContent = "00:00:00";

            alert("Your session has been ended by the admin.");
        }

    } catch (error) {

        console.error(
            "Session status error:",
            error
        );

    }

}, 3000);

const gameContainer =
    document.getElementById("gameContainer");


async function loadGames() {

    const games =
        await window.electronAPI.getGames();

    gameContainer.innerHTML = "";

    for (const gameId in games) {

        const game =
            games[gameId];

        const gameElement =
            document.createElement("div");

        gameElement.classList.add("game");

        gameElement.innerHTML = `
            <img src="icons/${gameId}.jpg">
            <p>${game.name}</p>
        `;

        gameElement.addEventListener("click", async function() {

            const result =
                await window.electronAPI.launchGame(gameId);

            if (!result.success) {

                alert(result.message);

            }

        });

        gameContainer.appendChild(gameElement);

    }

}


loadGames();

