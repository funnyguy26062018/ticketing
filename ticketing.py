# ---------- IMPORTS ----------
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
#from fastapi import FastAPI, BackgroundTasks
import uuid
import time
import json
import re
import requests
import os


# ---------- CONFIG ----------
USERNAME = "schuessler@stwhd"
PASSWORD = "triumph01"
LOGIN_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php"
DASHBOARD_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Base/Home/Index"
# "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Search/UnresolvedOwner/" + STAFF ID
OWNER_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Search/UnresolvedOwner/"
ONLINE_STAFF = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Base/AJAX/OnlineStaff"
# "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/View/" + DATABASE ID
TICKET_VIEW_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/View/"
# "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/GeneralSubmit/" + DATABASE  ID + "/inbox/-1/-1/-1/0"
TICKET_UPDATE_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/GeneralSubmit/"
# https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/AddNoteSubmit/ + DATABASE ID
NOTE_SUBMIT_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/AddNoteSubmit/"
# https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/AddNote/ + DATABASE ID
NOTE_URL = "https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/AddNote/"
STAFF_ID_ME = "93"
staff_IDs = {
    "me": "93",
    "Thomas Schüßler": "61",
    "Murad Kurt": "94",
    "Michael Beigel": "31"
}
DEPARTMENT_ID = "3"
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfiG_GjLQ0WFQZLJcq8fs2yfXKB26p3KGRcMh0HEIb3dYJoqYR662XVqScbEvdzJYb/exec"


#GZO-546-21688, 71925
#QEE-225-71535, 71484
#IHO-795-23535, 72144
# href="https://dev.nexabit.net/apps/stwhd/staff/index.php?/Tickets/Ticket/View/71925/inbox/-1/-1/-1"
# For login: https://dev.nexabit.net/apps/stwhd/cron/index.php?/Base/CronManager/Execute&_=1770672735424
# Session ID: 4YhtZs5Qm0QR83sD78bd7b5f8d495f0625b3e839b408fb8f0ac04d93bjFHSMm99CYDN34wqAnqXhO


# ---------- FUNCTION DECLARATIONS ----------
def login():
    # ---------- SETUP SELENIUM ----------
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")   # Run headless (no GUI)
    chrome_options.add_argument("--no-sandbox")     # Required in CI environments
    chrome_options.add_argument("--disable-dev-shm-usage")  # Avoid shared memory issues
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    # Make sure you have chromedriver installed or in PATH
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    # Open login page
    driver.get(LOGIN_URL)
    # Fill login form
    driver.find_element(By.ID, "username").send_keys(USERNAME)
    driver.find_element(By.ID, "password").send_keys(PASSWORD)
    driver.find_element(By.NAME, "submitbutton").click()
    # Wait for dashboard to load
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".stats")))
    # Optional: give JS a moment to finish
    time.sleep(2)
    # Initialize session
    session = requests.Session()
    for cookie in driver.get_cookies():
        session.cookies.set(
            name=cookie["name"],
            value=cookie["value"],
            domain=cookie["domain"],
            path=cookie.get("path", "/")
        )
    # Optional but recommended
    session.headers.update({
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    #driver.get(TICKET_VIEW_URL + "72144")
    #time.sleep(5)
    driver.quit()   # 👈 Selenium is now gone forever
    result = {
    "status": "ok",
    "tickets_scraped": 5,
    "example_field": "test"
    }

    # Write output.json in the current working directory
    with open("output.json", "w") as f:
        json.dump(result, f, indent=2)
    return session

def getDashboardStatistics():
    # After login the dashboard webpage is automatically loaded
    html = getParsedHTML(session, DASHBOARD_URL)
    elements = html.find_all(class_="dashboardprogress")
    staff_tickets = {}
    for element in elements:
        element_name = element.find(class_="dashboardprogresstitle")
        element_amount = element.find(class_="dashboardprogresscount")
        name = element_name.text.strip() or ""
        amount = int(element_amount.text.strip()) or 0
        if "STWHD.FM" in name: amount_total = amount
        if "Sebastian" in name and "Linn" in name: amount_person = amount
        staff_tickets[name] = amount
    if amount_total != 0:
        percentage_person = amount_person / amount_total * 100
        percentage_person_rounded = round(percentage_person, 0)
    else:
        percentage_person_rounded = "Division by 0"
    print(amount_total)
    print(amount_person)
    print(percentage_person)
    print(percentage_person_rounded)
    return staff_tickets

def getTickets():
    tickets_employees = []
    for staff_ID in staff_IDs.values():
        tickets_employee = getMyTickets(staff_ID)
        tickets_employees.extend(tickets_employee)
    return tickets_employees

def getMyTickets(staff_ID):
    html = getParsedHTML(session, OWNER_URL + staff_ID)
    # Checks if the person has tickets
    messages = html.find_all(class_="gridrowitalic")
    for message in messages:
        if "nothing" in message: return []
    elements_header_titles = html.find_all(class_=["gridtabletitlerow", "gridtabletitlerowsel"])
    header_titles_unsorted = ["Date", "Ticket ID", "Status", "Owner", "Subject", "Name"]
    header_titles_sorted = []
    for element_header_title in elements_header_titles:
        header_title = element_header_title.text.strip()
        if header_title in header_titles_unsorted:
            header_titles_sorted.append(header_title)
        else:
            header_titles_sorted.append("")
    ticket_entries = html.find_all(class_=["gridrow1", "gridrow2"])
    tickets = []
    for ticket_entry in ticket_entries:
        ticket = {}
        ticket_columns = ticket_entry.find_all("td")
        index_date = header_titles_sorted.index(header_titles_unsorted[0])
        ticket_date = ticket_columns[index_date].text
        index_ticket_ID = header_titles_sorted.index(header_titles_unsorted[1])
        element_IDs = ticket_columns[index_ticket_ID]
        url = element_IDs.find("a")["href"]
        match_ID = re.search("view/(\\d+)", url, re.IGNORECASE)
        database_ID = match_ID.group(1) if match_ID else ""
        ticket_ID = element_IDs.text
        index_status = header_titles_sorted.index(header_titles_unsorted[2])
        ticket_status = ticket_columns[index_status].text
        index_owner = header_titles_sorted.index(header_titles_unsorted[3])
        ticket_owner = ticket_columns[index_owner].text
        index_subject = header_titles_sorted.index(header_titles_unsorted[4])
        ticket_subject = ticket_columns[index_subject].text
        index_name = header_titles_sorted.index(header_titles_unsorted[5])
        ticket_name = ticket_columns[index_name].text
        ticket["date"] = ticket_date
        ticket["database_ID"] = database_ID
        ticket["ticket-ID"] = ticket_ID
        ticket["status"] = ticket_status.strip()
        ticket["owner"] = ticket_owner
        ticket["subject"] = ticket_subject.strip()
        ticket["name"] = ticket_name
        ticket = ticket | getTicketDetails(database_ID)
        tickets.append(ticket)
    return tickets

def getTicketDetails(ticket_ID_database):
    html = getParsedHTML(session, TICKET_VIEW_URL + ticket_ID_database)
    ticketDetails = {}
    containerNotes = html.find(id="ticketnotescontainerdiv").find_all("blockquote")
    ticketDetails["note"] = containerNotes[-1].text.strip()
    tableDamage = html.find("th",string="SCHADEN").find_parent("table")
    if tableDamage:
        damageDetails = getTableData(tableDamage)
        ticketDetails |= damageDetails
    tableContactDetails = html.find("th",string="KONTAKTDATEN").find_parent("table")
    if tableContactDetails:
        contactDetails = getTableData(tableContactDetails)
        ticketDetails |= contactDetails
    tableOther = html.find("th",string="RESTLICHES (WICHTIG!)").find_parent("table")
    if tableOther:
        otherDetails = getTableData(tableOther)
        ticketDetails |= otherDetails
    if not ticketDetails:
        message = html.find("div", class_="ticketpostcontentsdetailscontainer")
        if message: ticketDetails["message"] = message.text.strip()
    return ticketDetails

def getTableData(table):
    ticketDetails = {}
    tableRows = table.find_all("tr")
    for tableRow in tableRows:
        tableData = tableRow.find_all("td")
        if len(tableData) == 0: continue
        field = tableData[0].text.strip().rstrip(":")
        value = tableData[1].text.strip()
        if field == "Betrifft mein Zimmer":
            ticketDetails["regardingRoom"] = value
        elif field == "Betrifft":
            ticketDetails["type"] = value
        elif field == "Beschreibung":
            ticketDetails["description"] = value
        elif field == "Mieter-Typ":
            ticketDetails["typeTenant"] = value
        elif field == "Anrede":
            ticketDetails["salutation"] = value
        elif field == "Nachname, Vorname":
            ticketDetails["firstLastName"] = value
        elif field == "Wohnanlage":
            ticketDetails["building"] = value
        elif field == "Zimmernr.":
            ticketDetails["roomNumber"] = value
        elif field == "E-Mail Adresse":
            ticketDetails["email"] = value
        elif field == "Telefonnr.":
            ticketDetails["phoneNumber"] = value
        elif field == "Zugang in meiner Abwesenheit":
            ticketDetails["accessGranted"] = value
        elif field == "Weitergabe der E-Mail Adresse":
            ticketDetails["emailForwarding"] = value
        elif field == "Weitergabe der Telefonnummer":
            ticketDetails["phoneNumberForwarding"] = value
        else:
            ticketDetails.setdefault("unmappedFields", []).append(field)
    return ticketDetails

# Updates the ticket statuses
def updateTickets(tickets):
    for ticket in tickets:
        status_code = addTicketNote(ticket)
        print(ticket["note"] + ":" + status_code)
        status_code = updateTicket(ticket)
        print(ticket["databaseID"] + ": " + status_code)

def addTicketNote(ticket):
    ticket_ID_database = ticket["databaseID"]
    # Navigates to the ticket details page
    html = getParsedHTML(session, NOTE_URL + ticket_ID_database)
    # Gets the submission URL
    action_url = html.find("form", id="ticketaddnotesform")["action"]
    # Gets the hidden CSRF token
    csrfhash = html.find("input", id="csrfhash")["value"]
    # Constructs the payload to be sent
    payload = {
        "ticketnotes": ticket["note"],
        "notecolor_ticketnotes": "1",
        "notetype": "ticket",
        "forstaffid": "0",
        # REQUIRED by Kayako
        "_isDialog": "1",
        "csrfhash": csrfhash,
    }
    # Constructs the header
    headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Referer": TICKET_VIEW_URL + ticket_ID_database
    }
    # Post request to update ticket
    response = session.post(action_url, data=payload, headers=headers)
    return response.status_code

# Updates the ticket status
def updateTicket(ticket):
    ticket_ID_database = ticket["databaseID"]
    # Navigates to the ticket details page
    html = getParsedHTML(session, TICKET_VIEW_URL + ticket_ID_database)
    # Gets the submission URL
    action_url = html.find("form", id="View_Ticketform")["action"]
    # Gets the hidden CSRF token
    csrfhash = html.find("input", id="csrfhash")["value"]
    # Constructs the payload to be sent
    payload = {
        "gendepartmentid": DEPARTMENT_ID,
        "genownerstaffid": STAFF_ID_ME,
        "genticketstatusid": ticket["statusToSet"],
        # REQUIRED by Kayako
        "isajax": "1",
        "csrfhash": csrfhash,
    }
    # Constructs the header
    headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Referer": TICKET_VIEW_URL + ticket_ID_database
    }
    # Post request to update ticket
    response = session.post(action_url, data=payload, headers=headers)
    return response.status_code

def getParsedHTML(session, url):
    # Navigates to the ticket details page
    webpage = session.get(url, timeout=15)
    webpage.raise_for_status()
    # Initialize BeatifulSoup
    html = BeautifulSoup(webpage.text, "html.parser")
    return html

def saveInGoogleSheets(data):
    #payload = json.dumps(tickets, ensure_ascii=False, indent=2)
    try:
        response = requests.post(APPS_SCRIPT_URL, json=data, timeout=20)
        print("STATUS CODE:", response.status_code)
        print("RESPONSE TEXT:", response.text)
        print("Apps Script response:", response.text)
    except Exception as e:
        print("Background task error:", e)


# ---------- START: GETS THE PASSED PARAMETERS FROM GAS ----------
ticketData = json.loads(os.getenv("TICKET_DATA", "all"))
mode = os.getenv("MODE", "full") # No need so far
# ---------- RETRIEVES WEBSITE INFORMATION ----------
# Login to website
session = login()
# Data to send to Google Sheets
dataToSend = {}
# Scrape ticket overview
dataToSend["dashboardStatistics"] = getDashboardStatistics()
print(dataToSend["dashboardStatistics"])
# Update ticket
#ticketData = []
updateTickets(ticketData)
# Scrape my tickets
dataToSend["myTickets"] = getTickets()
print("My tickets: " + json.dumps(dataToSend["myTickets"], ensure_ascii=False, indent=2))
print("number tickets: " + str(len(dataToSend["myTickets"])))
# Saves the scraped info in Google Sheets
saveInGoogleSheets(dataToSend)