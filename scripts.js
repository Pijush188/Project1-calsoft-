function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].className = tabContents[i].className.replace(" active-content", "");
    }
    
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(" active", "");
    }
    
    document.getElementById(tabName).className += " active-content";
    evt.currentTarget.className += " active";
}

// Utility functions
function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, filename);
}

function downloadCSV(text, filename) {
    const blob = new Blob([text], { type: 'text/csv' });
    downloadBlob(blob, filename);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Fetch all pages from paginated API
async function fetchAllPages(baseUrl) {
    let page = 1;
    let allResults = [];
    let moreResults = true;
    
    while (moreResults) {
        try {
            const response = await fetch(`${baseUrl}?page=${page}&pageSize=50`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            allResults = [...allResults, ...data];
            
            // Check if we should continue (if we got fewer than pageSize, we're done)
            if (data.length < 50) {
                moreResults = false;
            } else {
                page++;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            moreResults = false;
        }
    }
    
    return allResults;
}

// Q1: Houses functionality
document.getElementById('fetch-houses').addEventListener('click', async () => {
    // Show loading indicator
    document.getElementById('houses-loading').style.display = 'block';
    document.getElementById('houses-result').style.display = 'none';
    document.getElementById('download-houses').disabled = true;
    
    try {
        // Fetch all houses from the API
        const houses = await fetchAllPages('https://anapioficeandfire.com/api/houses');
        
        // Sort houses alphabetically by name
        houses.sort((a, b) => a.name.localeCompare(b.name));
        
        // Create a text representation of houses and regions
        let textFileContent = "Houses and Regions of Ice and Fire\n";
        textFileContent += "============================\n\n";
        
        let tableHTML = `
            <table>
                <tr>
                    <th>House Name</th>
                    <th>Region</th>
                </tr>
        `;
        
        houses.forEach(house => {
            const region = house.region || 'Unknown Region';
            textFileContent += `${house.name} - ${region}\n`;
            
            tableHTML += `
                <tr>
                    <td>${house.name}</td>
                    <td>${region}</td>
                </tr>
            `;
        });
        
        tableHTML += `</table>`;
        
        // Store text content for download
        window.housesText = textFileContent;
        
        // Display results
        document.getElementById('houses-result').innerHTML = `
            <p>Found ${houses.length} houses, sorted alphabetically:</p>
            ${tableHTML}
        `;
        
        // Show result and enable download
        document.getElementById('houses-result').style.display = 'block';
        document.getElementById('download-houses').disabled = false;
    } catch (error) {
        document.getElementById('houses-result').innerHTML = `
            <p>Error: ${error.message}</p>
        `;
        document.getElementById('houses-result').style.display = 'block';
    } finally {
        document.getElementById('houses-loading').style.display = 'none';
    }
});

document.getElementById('download-houses').addEventListener('click', () => {
    if (window.housesText) {
        downloadTextFile(window.housesText, 'houses_of_ice_and_fire.txt');
    }
});

// Q2: Books functionality
document.getElementById('fetch-books').addEventListener('click', async () => {
    // Show loading indicator
    document.getElementById('books-loading').style.display = 'block';
    document.getElementById('books-result').style.display = 'none';
    document.getElementById('download-books').disabled = true;
    
    try {
        // Fetch all books from the API
        const books = await fetchAllPages('https://anapioficeandfire.com/api/books');
        
        // Create a dictionary of book data
        const bookDict = {};
        
        books.forEach(book => {
            bookDict[book.name] = [
                book.numberOfPages,
                new Date(book.released).toISOString().split('T')[0],
                book.isbn,
                book.publisher
            ];
        });
        
        // Create CSV content
        let csvContent = "Book Name,Pages,Release Date,ISBN,Publisher\n";
        
        for (const [bookName, details] of Object.entries(bookDict)) {
            const csvRow = [
                `"${bookName}"`,
                details[0],
                details[1],
                `"${details[2]}"`,
                `"${details[3]}"`
            ].join(',');
            csvContent += csvRow + '\n';
        }
        
        // Store CSV content for download
        window.booksCSV = csvContent;
        
        // Create a table for display
        let tableHTML = `
            <table>
                <tr>
                    <th>Book Name</th>
                    <th>Pages</th>
                    <th>Release Date</th>
                    <th>ISBN</th>
                    <th>Publisher</th>
                </tr>
        `;
        
        for (const [bookName, details] of Object.entries(bookDict)) {
            tableHTML += `
                <tr>
                    <td>${bookName}</td>
                    <td>${details[0]}</td>
                    <td>${details[1]}</td>
                    <td>${details[2]}</td>
                    <td>${details[3]}</td>
                </tr>
            `;
        }
        
        tableHTML += `</table>`;
        
        // Display results
        document.getElementById('books-result').innerHTML = `
            <p>Found ${books.length} books:</p>
            ${tableHTML}
        `;
        
        // Show result and enable download
        document.getElementById('books-result').style.display = 'block';
        document.getElementById('download-books').disabled = false;
    } catch (error) {
        document.getElementById('books-result').innerHTML = `
            <p>Error: ${error.message}</p>
        `;
        document.getElementById('books-result').style.display = 'block';
    } finally {
        document.getElementById('books-loading').style.display = 'none';
    }
});

document.getElementById('download-books').addEventListener('click', () => {
    if (window.booksCSV) {
        downloadCSV(window.booksCSV, 'books_of_ice_and_fire.csv');
    }
});

// Q3: Characters functionality
document.getElementById('fetch-characters').addEventListener('click', async () => {
    // Show loading indicator
    document.getElementById('characters-loading').style.display = 'block';
    document.getElementById('q3-progress').style.display = 'block';
    document.getElementById('characters-result').style.display = 'none';
    document.getElementById('download-characters').disabled = true;
    
    try {
        // Fetch first page to get pagination info
        const firstPageResponse = await fetch('https://anapioficeandfire.com/api/characters?page=1&pageSize=50');
        if (!firstPageResponse.ok) throw new Error(`HTTP error! status: ${firstPageResponse.status}`);
        
        // Get total count from header if available
        const linkHeader = firstPageResponse.headers.get('Link');
        
        let totalPages = 1;
        if (linkHeader) {
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch && lastPageMatch[1]) {
                totalPages = parseInt(lastPageMatch[1]);
            }
        }
        
        // Start processing characters in batches
        let allCharacters = [];
        const pageSize = 50;
        
        for (let page = 1; page <= totalPages; page++) {
            // Update progress bar
            const progress = Math.round((page / totalPages) * 100);
            document.getElementById('q3-progress-bar').style.width = `${progress}%`;
            document.getElementById('characters-loading').textContent = 
                `Fetching characters data: Page ${page} of ${totalPages} (${progress}%)`;
            
            const response = await fetch(`https://anapioficeandfire.com/api/characters?page=${page}&pageSize=${pageSize}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const characters = await response.json();
            allCharacters = [...allCharacters, ...characters];
            
            // If we're processing a lot of data, let's do some initial filtering
            // Only keep characters that have names and TV series appearances
            allCharacters = allCharacters.filter(char => 
                char.name && char.name.trim() !== '' && 
                char.tvSeries && char.tvSeries.length > 0 && 
                char.tvSeries[0] !== ''
            );
        }
        
        // Calculate TV appearances and sort
        const characterData = allCharacters.map(char => {
            return {
                name: char.name || 'Unnamed Character',
                seasons: char.tvSeries.filter(season => season && season !== '').length,
                gender: char.gender || 'Unknown',
                culture: char.culture || 'Unknown',
                born: char.born || 'Unknown',
                titles: char.titles.filter(title => title && title !== '').join(', ') || 'None',
                aliases: char.aliases.filter(alias => alias && alias !== '').join(', ') || 'None'
            };
        });
        
        // Sort by number of seasons (descending)
        characterData.sort((a, b) => b.seasons - a.seasons);
        
        // Create CSV content
        let csvContent = "Character Name,Seasons Count,Gender,Culture,Born,Titles,Aliases\n";
        
        characterData.forEach(char => {
            const csvRow = [
                `"${char.name.replace(/"/g, '""')}"`,
                char.seasons,
                `"${char.gender}"`,
                `"${char.culture.replace(/"/g, '""')}"`,
                `"${char.born.replace(/"/g, '""')}"`,
                `"${char.titles.replace(/"/g, '""')}"`,
                `"${char.aliases.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += csvRow + '\n';
        });
        
        // Store CSV content for download
        window.charactersCSV = csvContent;
        
        // Create a table for display (showing top 50 for performance)
        let tableHTML = `
            <table>
                <tr>
                    <th>Character Name</th>
                    <th>Seasons Count</th>
                    <th>Gender</th>
                    <th>Culture</th>
                </tr>
        `;
        
        characterData.slice(0, 50).forEach(char => {
            tableHTML += `
                <tr>
                    <td>${char.name}</td>
                    <td>${char.seasons}</td>
                    <td>${char.gender}</td>
                    <td>${char.culture}</td>
                </tr>
            `;
        });
        
        tableHTML += `</table>`;
        
        // Display results
        document.getElementById('characters-result').innerHTML = `
            <p>Found ${characterData.length} characters with TV appearances, sorted by number of seasons:</p>
            <p><strong>Note:</strong> Showing top 50 characters. Download the CSV for the complete list.</p>
            ${tableHTML}
        `;
        
        // Show result and enable download
        document.getElementById('characters-result').style.display = 'block';
        document.getElementById('download-characters').disabled = false;
    } catch (error) {
        document.getElementById('characters-result').innerHTML = `
            <p>Error: ${error.message}</p>
        `;
        document.getElementById('characters-result').style.display = 'block';
    } finally {
        document.getElementById('characters-loading').style.display = 'none';
    }
});

document.getElementById('download-characters').addEventListener('click', () => {
    if (window.charactersCSV) {
        downloadCSV(window.charactersCSV, 'characters_of_ice_and_fire.csv');
    }
});