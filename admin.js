let adminToken = null;
async function adminFetch(url, options = {}) {

    options.headers = {
        ...(options.headers || {}),
        "Authorization": "Bearer " + adminToken
    };

    return fetch(url, options);
}

const adminLogoutButton =
    document.getElementById("adminLogoutButton");

const adminLogin = document.getElementById("adminLogin");
const adminDashboard = document.getElementById("adminDashboard");

const adminUsername =
    document.getElementById("adminUsername");

const adminPassword =
    document.getElementById("adminPassword");

const adminLoginButton =
    document.getElementById("adminLoginButton");

    adminLoginButton.addEventListener("click", async function() {

        const username = adminUsername.value;
        const password = adminPassword.value;
    
        try {
    
            const response = await fetch(
                "http://127.0.0.1:5000/admin-login",
                {
                    method: "POST",
    
                    headers: {
                        "Content-Type": "application/json"
                    },
    
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );
    
            const result = await response.json();
    
            if (result.success) {

                adminToken = result.token;
            
                adminLogin.style.display = "none";
                adminDashboard.style.display = "block";
            
                loadCustomers();

                loadTodayStats();
                
                loadPCs();
                loadSessions();

                setInterval(loadTodayStats, 2000);
                setInterval(loadPCs, 1000);
                setInterval(loadSessions, 2000);

            
            }
            
             else {
    
                alert(result.message);
    
            }
    
        } catch (error) {
    
            console.error(error);
    
            alert("Unable to connect to server.");
    
        }
    
    });

    adminLogoutButton.addEventListener("click", async function() {

        try {
    
            const response = await adminFetch(
                "http://127.0.0.1:5000/admin-logout",
                {
                    method: "POST"
                }
            );
    
            const result = await response.json();
    
            if (result.success) {
    
                adminToken = null;
    
                adminDashboard.style.display = "none";
                adminLogin.style.display = "block";
    
                adminUsername.value = "";
                adminPassword.value = "";
    
            } else {
    
                alert(result.message);
    
            }
    
        } catch (error) {
    
            console.error(error);
    
            alert("Unable to logout.");
    
        }
    
    });


const pcContainer = document.getElementById("pcContainer");

const sessionContainer = document.getElementById("sessionContainer");

const customerContainer =

document.getElementById("customerContainer");

    const customerSearch =

document.getElementById("customerSearch");

    const addCustomerButton =

document.getElementById("addCustomerButton");

    const customerModal =
    document.getElementById("customerModal");

const cancelCustomerButton =
    document.getElementById("cancelCustomerButton");

    const saveCustomerButton =
    document.getElementById("saveCustomerButton");

const newCustomerName =
    document.getElementById("newCustomerName");

const newCustomerId =
    document.getElementById("newCustomerId");

const newCustomerPassword =
    document.getElementById("newCustomerPassword");

const confirmCustomerPassword =
    document.getElementById("confirmCustomerPassword");

const historyModal =
    document.getElementById("historyModal");

const historyContainer =
    document.getElementById("historyContainer");

const closeHistoryButton =
    document.getElementById("closeHistoryButton");

const historyTitle =
    document.getElementById("historyTitle");

const totalPCs =
    document.getElementById("totalPCs");

const inUsePCs =
    document.getElementById("inUsePCs");

const availablePCs =
    document.getElementById("availablePCs");

const customersToday =
    document.getElementById("customersToday");

const sessionsToday =
    document.getElementById("sessionsToday");

const currentlyPlaying =
    document.getElementById("currentlyPlaying");

    console.log("Today cards:", {
        customersToday,
        sessionsToday,
        currentlyPlaying
    });

async function loadPCs() {

    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/pcs"
        );

        if (!response.ok) {
            throw new Error(
                "Server returned " + response.status
            );
        }

        const pcs = await response.json();

        console.log("PC data:", pcs);

        totalPCs.textContent = pcs.length;

        const inUseCount = pcs.filter(function(pc) {
            return pc.status === "IN USE";
        }).length;
        
        const availableCount = pcs.filter(function(pc) {
            return pc.status === "AVAILABLE";
        }).length;
        
        inUsePCs.textContent = inUseCount;
        availablePCs.textContent = availableCount;

        pcContainer.innerHTML = "";

        pcs.forEach(function(pc) {

            const card = document.createElement("div");

            card.className = "pc-card";

            let durationHTML = "";

            if (pc.login_time) {

                const loginTime = new Date(
                    pc.login_time.replace(" ", "T")
                );

                const now = new Date();

                const difference = now - loginTime;

                const totalSeconds =
                    Math.floor(difference / 1000);

                const hours =
                    Math.floor(totalSeconds / 3600);

                const minutes =
                    Math.floor(
                        (totalSeconds % 3600) / 60
                    );

                const seconds =
                    totalSeconds % 60;

                const duration =
                    String(hours).padStart(2, "0") +
                    ":" +
                    String(minutes).padStart(2, "0") +
                    ":" +
                    String(seconds).padStart(2, "0");

                durationHTML = `
                    <p>Duration: ${duration}</p>
                `;
            }

            if (pc.status === "IN USE") {

                card.innerHTML = `
                <h2>${pc.pc_name}</h2>

                <p class="status in-use">
                IN USE
                </p>

                <p>
                    Customer: ${pc.customer_name}
                </p>
            
                <p>
                    Login Time: ${pc.login_time}
                </p>
            
                ${durationHTML}
            
                <button class="force-logout-button"
                    onclick="forceLogout('${pc.pc_name}')">
                    FORCE LOGOUT
                </button>
                `;

            } else {

                card.innerHTML = `
                    <h2>${pc.pc_name}</h2>

                    <p class="status available">
                     AVAILABLE
                     </p>

                    <p>
                        No customer
                    </p>
                `;
            }

            pcContainer.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Admin Dashboard Error:",
            error
        );

        pcContainer.innerHTML = `
            <p>Unable to connect to server.</p>
        `;
    }
}

// =========================
// LOAD SESSION HISTORY
// =========================

async function loadSessions() {

    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/sessions"
        );

        if (!response.ok) {
            throw new Error(
                "Server returned " + response.status
            );
        }

        const sessions = await response.json();

        console.log("Session data:", sessions);

        sessionContainer.innerHTML = "";

        sessions.forEach(function(session) {

            const row = document.createElement("tr");

            const loginTime = new Date(
                session.login_time.replace(" ", "T")
            );

            const logoutTime = new Date(
                session.logout_time.replace(" ", "T")
            );

            const difference =
                logoutTime - loginTime;

            const totalSeconds =
                Math.floor(difference / 1000);

            const hours =
                Math.floor(totalSeconds / 3600);

            const minutes =
                Math.floor(
                    (totalSeconds % 3600) / 60
                );

            const seconds =
                totalSeconds % 60;

            const duration =
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0") +
                ":" +
                String(seconds).padStart(2, "0");

            row.innerHTML = `
                <td>${session.customer_id}</td>
                <td>${session.customer_name}</td>
                <td>${session.pc_name}</td>
                <td>${session.login_time}</td>
                <td>${session.logout_time}</td>
                <td>${duration}</td>
            `;

            sessionContainer.appendChild(row);

        });

    } catch (error) {

        console.error(
            "Session History Error:",
            error
        );

        sessionContainer.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load session history.
                </td>
            </tr>
        `;
    }
}

async function forceLogout(pcName) {

    const confirmLogout = confirm(
        "Force logout the customer using " + pcName + "?"
    );

    if (!confirmLogout) {
        return;
    }

    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/force-logout",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    pc_name: pcName
                })
            }
        );

        const result = await response.json();

        alert(result.message);

        loadPCs();
        loadSessions();

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");
    }
}

async function viewHistory(customerId, customerName) {
    historyTitle.textContent =
    customerName + "'s Session History";

    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/customer-history/" + customerId
        );

        const history = await response.json();

        historyContainer.innerHTML = "";

        history.forEach(function(session) {

            const row = document.createElement("tr");

            const loginTime = new Date(
                session.login_time.replace(" ", "T")
            );
            
            const logoutTime = new Date(
                session.logout_time.replace(" ", "T")
            );
            
            const difference = logoutTime - loginTime;
            
            const totalSeconds =
                Math.floor(difference / 1000);
            
            const hours =
                Math.floor(totalSeconds / 3600);
            
            const minutes =
                Math.floor((totalSeconds % 3600) / 60);
            
            const seconds =
                totalSeconds % 60;
            
            const duration =
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0") +
                ":" +
                String(seconds).padStart(2, "0");
            
            
            row.innerHTML = `
                <td>${session.pc_name}</td>
                <td>${session.login_time}</td>
                <td>${session.logout_time}</td>
                <td>${duration}</td>
            `;

            historyContainer.appendChild(row);

        });

        historyModal.style.display = "flex";

    } catch (error) {

        console.error("History Error:", error);

        alert("Unable to load customer history.");

    }

}

closeHistoryButton.addEventListener("click", function() {

    historyModal.style.display = "none";

});

// =========================
// LOAD CUSTOMERS
// =========================

async function loadCustomers() {

    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/customers"
        );

        if (!response.ok) {
            throw new Error(
                "Server returned " + response.status
            );
        }

        const customers = await response.json();
        
        function displayCustomers(customerList) {

            customerContainer.innerHTML = "";
        
            customerList.forEach(function(customer) {
        
                const row = document.createElement("tr");
        
                row.innerHTML = `
                    <td>${customer.customer_id}</td>
                    <td>${customer.name}</td>
                    <td>
                        <button onclick="viewHistory('${customer.customer_id}', '${customer.name}')">
                            HISTORY
                        </button>
                    </td>
                `;
        
                customerContainer.appendChild(row);
        
            });
        
        }
        
        
        displayCustomers(customers);
        
        
        customerSearch.addEventListener("input", function() {
        
            const searchText =
                customerSearch.value.toLowerCase();
        
            const filteredCustomers =
                customers.filter(function(customer) {
        
                    return (
                        customer.customer_id
                            .toLowerCase()
                            .includes(searchText) ||
        
                        customer.name
                            .toLowerCase()
                            .includes(searchText)
                    );
        
                });
        
            displayCustomers(filteredCustomers);
        
        });

        console.log("Customer data:", customers);

    } catch (error) {

        console.error(
            "Customer Loading Error:",
            error
        );

        customerContainer.innerHTML = `
            <tr>
                <td colspan="2">
                    Unable to load customers.
                </td>
            </tr>
        `;
    }
}

addCustomerButton.addEventListener("click", function() {

    customerModal.style.display = "flex";

});

cancelCustomerButton.addEventListener("click", function() {

    customerModal.style.display = "none";

});

saveCustomerButton.addEventListener("click", async function() {

    const name = newCustomerName.value;
    const customerId = newCustomerId.value;
    const password = newCustomerPassword.value;
    const confirmPassword = confirmCustomerPassword.value;


    // Check empty fields

    if (
        name === "" ||
        customerId === "" ||
        password === "" ||
        confirmPassword === ""
    ) {

        alert("Please fill all fields.");

        return;
    }


    // Check passwords

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;
    }


    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/add-customer",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    customer_id: customerId,
                    password: password
                })
            }
        );


        const result = await response.json();


        if (result.success) {

            alert(result.message);

            customerModal.style.display = "none";

            newCustomerName.value = "";
            newCustomerId.value = "";
            newCustomerPassword.value = "";
            confirmCustomerPassword.value = "";

            loadCustomers();

        } else {

            alert(result.message);

        }


    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }

});

async function loadTodayStats() {

    try {

        const response = await adminFetch(
            "http://127.0.0.1:5000/today-stats"
        );

        const stats = await response.json();

        customersToday.textContent =
            stats.customers_today;

        sessionsToday.textContent =
            stats.sessions_today;

        currentlyPlaying.textContent =
            stats.currently_playing;

    } catch (error) {

        console.error(
            "Today's Stats Error:",
            error
        );

    }
}





