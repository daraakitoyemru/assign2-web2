import {
  modifyStyle,
  getExistingElement,
  readFromCache,
  writeToCache,
} from "./helpers/helperFunctions.js";

const domain = "https://www.randyconnolly.com/funwebdev/3rd/api/f1/";

/**
 * Checks if a key exists in localStorage. If it doesn't it will fetch data from the domain
 * and save it in localStorage with the given key name
 * @param {String} key key to be retrieved form localStorage
 * @param {String} query query to be appended to domain for querying
 * @returns Promise that when resolved will return array of json objects
 */
async function checkLocalStorage(key, query) {
  let localStorageMembers = readFromCache(key);
  if (!localStorageMembers) {
    await writeToCache(domain + query, key);
    localStorageMembers = readFromCache(key);
  }
  return localStorageMembers;
}

/**
 * Creates any valid element with optional attributes and text content
 * @param {String} htmlTag html tag to be created
 * @param {Object} attributes (optional) object of key value pairs where the key is that attribute and the value is the value of the attribute
 * @param {String} textContent (optional) string containing text
 * @returns
 */
function createElement(htmlTag, attributes = {}, textContent = null) {
  const element = document.createElement(htmlTag);
  if (JSON.stringify(attributes) !== "{}") {
    //credits : https://masteringjs.io/tutorials/fundamentals/foreach-object
    Object.entries(attributes).forEach((entry) => {
      const [key, value] = entry;
      element.setAttribute(key, value);
    });
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * Adds a row to an existing table
 * @param {String} parentElementSelector css selector referencing parent element in a table
 * @param {Object} object data for populating table row
 * @param {Array} propArr array containing properties to access object values. may contain node elements. must be in order of table headings
 */
function addTableRow(parentElementSelector, object, propArr) {
  const parent = document.querySelector(parentElementSelector);
  const tr = document.createElement("tr");

  propArr.forEach((property) => {
    const td = document.createElement("td");
    if (typeof property === "object") {
      td.appendChild(property);
      tr.appendChild(td);
    } else if (object.hasOwnProperty(property)) {
      td.textContent = object[property];
      tr.appendChild(td);
    }
  });

  parent.appendChild(tr);
}

document.addEventListener("DOMContentLoaded", () => {
  /**
   * TODO in general:
   *  - Need to create podium view
   *  - Create function(s) to populate modals
   *  - Add event listeners to clickable cells in table and display relevant modals
   *  - Either make table heading q1,q2, and q3 clickable (can be hard-coded or dynamic using createElement)
   *    or we could add a dropdown so when the user selects an option, we can sort results based on that.
   *    We can save that for later.
   *  - Fix styling, it's not looking so hot rn
   *  - Bonus if theres time: create and add to favorites view. Saved selected item in a favourites array and
   *  display in favourites view. Remove from favourites by removing it from the favourites array.
   */

  const homeSection = document.querySelector("#homeView");
  const seasonSelect = document.querySelector("#seasonSelect");
  const raceViewTitle = document.querySelector("#racesView h2");
  const raceView = document.querySelector("#racesView");
  const qualifyingTable = document.querySelector("#qualifyingTable");
  const resultsPodium = document.querySelector(".podium");
  const resultsTable = document.querySelector("#raceResults");
  const raceInfo = document.querySelector(".raceInfo");
  const driverModal = document.querySelector("#driverModal");
  const dialog = document.querySelector("dialog");
  const closeButton = document.querySelector(".close");
  const homeViewBtn = document.getElementById("homeViewBtn");
  const racesViewBtn = document.getElementById("racesViewBtn");
  let viewDriver;
  let year;
  modifyStyle(".lds-roller", "display", "none");
  raceInfo.style.display = "none";
  resultsPodium.style.display = "none";
  raceResults.style.display = "none";

  /*
  TODO for event listener below:
    1. Hide home view on click - done
    2. Show loading animation (show before promise.all) - done
    3. Hide loading animation (after promise.all? (not sure)) - done
    4. clean this event listener up
*/

  homeViewBtn.addEventListener("click", () => {
    homeView.style.display = "none";
    racesView.style.display = "none";
    qualifyingTable.style.display = "none";
    homeView.style.display = "flex";
    raceInfo.style.display = "none";
    raceResults.style.display = "none";
    resultsPodium.style.display = "none";
  });

  homeSection.addEventListener("change", async (e) => {
    if (e.target.nodeName === "SELECT" && e.target.id === "seasonSelect") {
      modifyStyle(".lds-roller", "display", "block");
      document.querySelector("#racesBody").replaceChildren();
      const year = e.target.value;
      const localStorageMembers = await Promise.all([
        checkLocalStorage(`raceData${year}`, "races.php?season=" + year),
        checkLocalStorage(`resultData${year}`, "results.php?season=" + year),

        checkLocalStorage(
          `qualifyingData${year}`,
          "qualifying.php?season=" + year
        ),
      ]);
      modifyStyle(".lds-roller", "display", "none");
      modifyStyle("#racesView", "display", "block");
      homeSection.style.display = "none";
      const raceData = localStorageMembers[0];

      raceViewTitle.textContent = `Races for ${year}`;

      raceData.forEach((raceObj) => {
        let link = createElement(
          "a",
          {
            href: "#",
            "data-id": raceObj["id"],
            id: `viewRace`,
            "data-year": year,
          },
          "View Race"
        );
        addTableRow("#racesBody", raceObj, ["round", "name", link]);
      });
    }
  });

  raceView.addEventListener("click", populateQualifying);

  function populateQualifying(e) {
    document.querySelector("#qualifyingTable tbody").replaceChildren();
    if (e.target.nodeName === "A" && e.target.id === "viewRace") {
      const year = e.target.dataset.year;
      const raceID = e.target.dataset.id;

      populateRaceInfo(year, raceID);
      populatePodium(year, raceID);

      function populateRaceInfo(year, raceID) {
        const raceData = readFromCache(`raceData${year}`);
        const race = raceData.find((race) => race.id == raceID);

        if (race) {
          raceInfo.querySelector(
            "h2"
          ).textContent = `Results for ${year} - ${race.name}`;
          raceInfo.querySelector(
            "p:nth-child(2)"
          ).innerHTML = `<strong>Race Name:</strong> ${race.name}`;
          raceInfo.querySelector(
            "p:nth-child(3)"
          ).innerHTML = `<strong>Round #:</strong> ${race.round}`;
          raceInfo.querySelector(
            "p:nth-child(4)"
          ).innerHTML = `<strong>Year:</strong> ${year}`;
          raceInfo.querySelector(
            "p:nth-child(5)"
          ).innerHTML = `<strong>Circuit Name:</strong> ${race.circuit.name}`;
          raceInfo.querySelector(
            "p:nth-child(6)"
          ).innerHTML = `<strong>Date:</strong> ${race.date}`;
          const raceUrl = raceInfo.querySelector("p:nth-child(7) a");
          raceUrl.href = race.url;
          raceUrl.textContent = "More Info";

          raceInfo.style.display = "block";
        }
      }

      let qualifying = readFromCache(`qualifyingData${year}`);
      let matches = qualifying.filter((q) => q.race.id == raceID); // raceID is a string so == is used instead of ===
      raceInfo.style.display = "block";
      resultsPodium.style.display = "block";

      matches.forEach((matchObj) => {
        const driverAttributes = {
          "data-driver-id": matchObj.driver["id"],
          "data-driver-ref": matchObj.driver["ref"],
          "data-race-year": matchObj.race["year"],
          href: "#",
          id: "viewDriver",
        };
        viewDriver = document.querySelector("#viewDriver");
        const constructorAttributes = {
          "data-constructor-id": matchObj.constructor["id"],
          "data-constructor-ref": matchObj.constructor["ref"],
          "data-race-year": matchObj.race["year"],
          href: "#",
          id: "viewConstructors",
        };
        const driverLink = createElement(
          "a",
          driverAttributes,
          `${matchObj.driver.forename} ${matchObj.driver.surname}`
        );
        const constructorLink = createElement(
          "a",
          constructorAttributes,
          `${matchObj.constructor.name}`
        );

        addTableRow("#qualifyingTable tbody", matchObj, [
          "position",
          driverLink,
          constructorLink,
          "q1",
          "q2",
          "q3",
        ]);
      });
      modifyStyle("#qualifyingTable", "display", "block");
    }
  }
  function populatePodium(year, raceID) {
    // Read race results from cache
    const resultsData = readFromCache(`resultData${year}`);
    const raceResults = resultsData.filter(
      (result) => result.race.id == raceID
    );

    if (raceResults.length > 0) {
      // Sort results by position
      const sortedResults = raceResults.sort((a, b) => a.position - b.position);

      // Map top 3 racers to podium items
      const podiumPositions = ["first", "second", "third"];
      sortedResults.slice(0, 3).forEach((result, index) => {
        const podiumItem = document.querySelector(
          `.podium-item.${podiumPositions[index]}`
        );
        podiumItem.querySelector(
          ".driver"
        ).textContent = `${result.driver.forename} ${result.driver.surname}`;
        podiumItem.querySelector(
          ".points"
        ).textContent = `${result.points} points`;
      });

      resultsPodium.style.display = "block";
    } else {
      console.error("No results found for the selected race.");
    }
  }

  qualifyingTable.addEventListener("click", async (e) => {
    if (e.target.nodeName === "A" && e.target.id === "viewDriver") {
      const driverRef = e.target.dataset.driverRef;
      const year = e.target.dataset.raceYear;
      let [driverResultsData, driverInfo] = await Promise.all([
        checkLocalStorage(
          `driverResults${year}`,
          `driverResults.php?driver=${driverRef}&season=${year}`
        ),
        checkLocalStorage(`driverInfo`, `drivers.php?`),
      ]);
      // modifyStyle(".modal", "display", "none");
      modifyStyle("#driverModal .container", "display", "flex");
      populateDriverModal(driverModal, driverRef, year);
    }
  });

  const raceResultsTable = document.querySelector("#raceResults tbody");

  async function populateRaceResults(e) {
    raceResultsTable.replaceChildren();

    if (e.target.nodeName === "A") {
      const year = e.target.dataset.year;
      const raceID = e.target.dataset.id;

      let resultData = readFromCache(`resultData${year}`);
      let raceResults = resultData.filter((result) => result.race.id == raceID);

      if (raceResults.length > 0) {
        modifyStyle("#raceResults", "display", "block");

        raceResults.forEach((result) => {
          const driverLinkAttributes = {
            href: "#",
            "data-driver-id": result.driver["id"],
            "data-driver-ref": result.driver["ref"],
            id: "viewDriver",
          };
          const driverLink = createElement(
            "a",
            driverLinkAttributes,
            `${result.driver.forename} ${result.driver.surname}`
          );

          const constructorLinkAttributes = {
            href: "#",
            "data-constructor-id": result.constructor["id"],
            "data-constructor-ref": result.constructor["ref"],
            id: "viewConstructors",
          };
          const constructorLink = createElement(
            "a",
            constructorLinkAttributes,
            result.constructor.name
          );

          addTableRow("#raceResults tbody", result, [
            "position",
            driverLink,
            constructorLink,
            "laps",
            "points",
          ]);
        });
      }
    }
  }

  // Add event listener to populate Results table
  raceView.addEventListener("click", populateRaceResults);

  /** TODO: create a function that add event listener to all dialog boxes for opening and closing
   * Also make one for populating modal based on different criteria, you'll call this in event listener above
   */
  driverModal.addEventListener("click", (e) => {
    if (e.target.className === "close") {
      driverModal.close();
    }
  });

  function populateDriverModal(modal, ref, year) {
    modal.showModal();
    /**
     * use find for getting data from driverResults?driver=ref&season=year
     *  grab resultID,
     */
    let driverInfo = readFromCache("driverInfo");
    let driverResultsData = readFromCache(`driverResults${year}`);

    let driver = driverInfo.find((data) => data.driverRef == ref);

    populateDriverCard(driver);

    let resultDataForYear = readFromCache(`resultData${year}`);
    let resultData;

    driverResultsData.forEach((data) => {
      let resultID = data.resultId;
      resultData = resultDataForYear.filter((r) => r.id == resultID);
      let points = resultData[0].points;
      let pointsTextNode = document.createTextNode(points);
      addTableRow("#driverResultsTable", data, [
        "round",
        "name",
        "positionOrder",
        pointsTextNode,
      ]);
    });
  }

  function populateDriverCard(data) {
    /**
     * get driver fname lname
     * get nationality
     * get dob, calc age
     * get url
     */
    const driverName = document.querySelector(".driverName");
    const nationality = document.querySelector(".nationality");
    const dob = document.querySelector(".driverDOB");
    const url = document.querySelector(".wiki");
    data = [data];

    data.forEach((d) => {
      driverName.textContent = `${d.forename} ${d.surname}`;
      nationality.textContent = `Nationality: ${d.nationality}`;
      dob.textContent = `DOB: ${d.dob}`;
    });
  }

  async function populateConstructorModal(modal, ref, year) {
    modal.showModal();

    const constructorInfo = readFromCache("constructorInfo");

    const constructor = constructorInfo.find(
      (data) => data.constructorRef === ref
    );

    populateConstructorCard(constructor);

    let constructorResultsData = readFromCache(`constructorResults${year}`);
    constructorResultsData.forEach((data) => {
      const driverName = data.driver
        ? `${data.driver.forename} ${data.driver.surname}`
        : "Unknown Driver";

      addTableRow("#constructorResultsTable", data, [
        "round",
        "name",
        driverName,
        "positionOrder",
      ]);
    });
  }

  function populateConstructorCard(data) {
    const constructorName = document.querySelector(".constructorName");
    const nationality = document.querySelector(".constructorNationality");
    const wiki = document.querySelector(".contact-wiki");

    constructorName.textContent = data.name;
    nationality.textContent = `Nationality: ${data.nationality}`;
    wiki.setAttribute("href", data.url);
    wiki.setAttribute("target", "_blank");
  }

  qualifyingTable.addEventListener("click", async (e) => {
    if (e.target.matches("a#viewDriver")) {
      const driverRef = e.target.dataset.driverRef;
      const year = e.target.dataset.raceYear;
      const driverResultsData = readFromCache(`driverResults${year}`);
      const driverInfo = readFromCache("driverInfo");

      const driver = driverInfo.find((data) => data.ref === driverRef);
      populateDriverModal(driverModal, driver, year);
    }

    if (e.target.matches("a#viewConstructors")) {
      const constructorRef = e.target.dataset.constructorRef;
      const year = e.target.dataset.raceYear;

      const constructorInfo = readFromCache("constructorInfo");
      const constructor = constructorInfo.find(
        (data) => data.ref === constructorRef
      );

      populateConstructorModal(constructorModal, constructor, year);
    }
  });

  constructorModal.addEventListener("click", (e) => {
    if (e.target.className === "close") {
      constructorModal.close();
    }
  });
  const constructorInfo = readFromCache("constructorInfo");
  console.log("Constructor Info:", constructorInfo);
});
