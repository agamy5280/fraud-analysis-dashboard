// Store all tabs information
let allTabs = [];

// Function to apply enhanced legend fixes to iframes
function applyLegendFix(iframe) {
  try {
    // Try to access the iframe content
    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframeWindow.document;

    // Add CSS to make legends more compact and better positioned in the iframe
    const styleElement = iframeDocument.createElement("style");
    styleElement.textContent = `
      .legend {
        font-size: 10px !important;
        overflow: visible !important;
        pointer-events: all !important;
        background-color: rgba(255, 255, 255, 0.7) !important;
        border-radius: 3px !important;
        padding: 3px !important;
      }
      .legend text {
        font-size: 10px !important;
        text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white;
      }
      .legendtext {
        font-size: 10px !important;
        text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white;
      }
      .legend rect {
        width: 12px !important;
        height: 12px !important;
      }
      svg {
        overflow: visible !important;
      }
      
      /* Fix for legends that might be clipped */
      .yaxislayer-above {
        pointer-events: all !important;
      }
      
      /* Enhanced visibility for legends */
      .legend-box {
        fill: rgba(255, 255, 255, 0.8) !important;
        stroke: rgba(0, 0, 0, 0.2) !important;
        rx: 3px !important;
      }
      
      /* Make chart area slightly smaller to accommodate legends */
      .plot-container {
        margin-right: 10% !important;
      }
      
      /* For Plotly hover labels */
      .hovertext {
        pointer-events: none !important;
      }
      
      /* Fix for chart titles */
      .gtitle {
        font-size: 16px !important;
        font-weight: bold !important;
      }
      
      /* Fix for Arabic text if present */
      text[dir="rtl"], .arabic {
        font-family: 'Arial', sans-serif !important;
      }
    `;

    iframeDocument.head.appendChild(styleElement);

    // Add script to make legends draggable if not already
    const scriptElement = iframeDocument.createElement("script");
    scriptElement.textContent = `
      // Add draggable functionality to legends
      function makeLegendsDraggable() {
        const legends = document.querySelectorAll('.legend');
        let legendsCount = 0;
        
        legends.forEach((legend, index) => {
          legendsCount++;
          
          // Only make draggable if not already
          if (!legend.getAttribute('data-draggable')) {
            makeElementDraggable(legend);
            legend.setAttribute('data-draggable', 'true');
            
            // If there's a risk of legends overlapping, reposition them
            if (legends.length > 1 && index > 0) {
              // For plots with multiple legends, position them better
              const svgElement = legend.closest('svg');
              if (svgElement) {
                const svgWidth = svgElement.getBoundingClientRect().width;
                const legendWidth = legend.getBoundingClientRect().width;
                
                // Calculate positions to avoid overlap
                let xPos = svgWidth - legendWidth - 10;
                let yPos = 10 + (index * 30);
                
                // Special handling for plots with right-side legends
                const filename = window.location.pathname.split('/').pop().toLowerCase();
                if (filename.includes('channel') || 
                    filename.includes('classification') ||
                    filename.includes('pattern')) {
                  xPos = Math.max(10, xPos - 100);
                }
                
                // Stagger legends vertically for better visibility
                legend.setAttribute('transform', \`translate(\${xPos}, \${yPos})\`);
              }
            }
          }
        });
        
        // Add annotation about draggable if there are legends
        if (legendsCount > 0 && !document.getElementById('legend-note')) {
          const noteDiv = document.createElement('div');
          noteDiv.id = 'legend-note';
          noteDiv.style.position = 'absolute';
          noteDiv.style.top = '10px';
          noteDiv.style.left = '10px';
          noteDiv.style.padding = '3px 8px';
          noteDiv.style.background = 'rgba(255,255,255,0.7)';
          noteDiv.style.border = '1px solid #ddd';
          noteDiv.style.borderRadius = '3px';
          noteDiv.style.fontSize = '11px';
          noteDiv.style.color = '#666';
          noteDiv.style.zIndex = '1000';
          noteDiv.style.pointerEvents = 'none';
          noteDiv.innerHTML = 'Tip: Click and drag legends to reposition';
          
          document.body.appendChild(noteDiv);
          
          // Fade out after 5 seconds
          setTimeout(() => {
            noteDiv.style.transition = 'opacity 1s';
            noteDiv.style.opacity = '0';
          }, 5000);
        }
        
        // Create legend toggle button for plots with multiple legends
        if (legendsCount > 2 && !document.getElementById('legend-toggle')) {
          const toggleBtn = document.createElement('button');
          toggleBtn.id = 'legend-toggle';
          toggleBtn.innerHTML = 'Toggle Legends';
          toggleBtn.style.position = 'absolute';
          toggleBtn.style.top = '10px';
          toggleBtn.style.right = '10px';
          toggleBtn.style.padding = '5px 10px';
          toggleBtn.style.background = '#3498db';
          toggleBtn.style.color = 'white';
          toggleBtn.style.border = 'none';
          toggleBtn.style.borderRadius = '3px';
          toggleBtn.style.cursor = 'pointer';
          toggleBtn.style.zIndex = '1000';
          
          toggleBtn.onclick = function() {
            const legends = document.querySelectorAll('.legend');
            legends.forEach(legend => {
              legend.style.display = legend.style.display === 'none' ? '' : 'none';
            });
          };
          
          document.body.appendChild(toggleBtn);
        }
      }
      
      // Improved draggable function with boundaries protection
      function makeElementDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;
        
        // Add visual indicator for draggable
        element.style.cursor = 'move';
        
        // Create parent if needed for absolute positioning
        const svgParent = element.closest('svg');
        if (svgParent) {
          // Get the transform values for proper positioning
          const currentTransform = element.getAttribute('transform') || '';
          const match = currentTransform.match(/translate\\(([^,]+),\\s*([^)]+)\\)/);
          let initialX = 0, initialY = 0;
          
          if (match) {
            initialX = parseFloat(match[1]);
            initialY = parseFloat(match[2]);
          }
          
          element.style.pointerEvents = 'all';
          
          element.onmousedown = dragMouseDown;
          
          function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation();
            
            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            isDragging = true;
            
            // Add temporary class to indicate dragging
            element.classList.add('dragging');
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
          }
          
          function elementDrag(e) {
            if (!isDragging) return;
            
            e = e || window.event;
            e.preventDefault();
            
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Get current transform values
            const currentTransform = element.getAttribute('transform') || '';
            const match = currentTransform.match(/translate\\(([^,]+),\\s*([^)]+)\\)/);
            let x = initialX, y = initialY;
            
            if (match) {
              x = parseFloat(match[1]);
              y = parseFloat(match[2]);
            }
            
            // Update position
            x = x - pos1;
            y = y - pos2;
            
            // Apply boundary constraints
            const svgRect = svgParent.getBoundingClientRect();
            const elemRect = element.getBoundingClientRect();
            
            // Keep within reasonable bounds
            x = Math.max(-elemRect.width/2, Math.min(svgRect.width - elemRect.width/2, x));
            y = Math.max(0, Math.min(svgRect.height - elemRect.height, y));
            
            // Set the element's new position
            element.setAttribute('transform', \`translate(\${x}, \${y})\`);
          }
          
          function closeDragElement() {
            // Stop moving when mouse button is released
            document.onmouseup = null;
            document.onmousemove = null;
            isDragging = false;
            element.classList.remove('dragging');
          }
        }
      }
    `;

    iframeDocument.body.appendChild(scriptElement);

    // Add a second script to handle specific legend positioning and overlap detection
    const legendScript = iframeDocument.createElement("script");
    legendScript.textContent = `
      // Function to automatically detect and fix legend overlaps
      function fixLegendOverlaps() {
        const legends = Array.from(document.querySelectorAll('.legend'));
        
        if (legends.length <= 1) return;
        
        // Get SVG container
        const svg = legends[0].closest('svg');
        if (!svg) return;
        
        const svgRect = svg.getBoundingClientRect();
        
        // Sort legends by vertical position
        legends.sort((a, b) => {
          const rectA = a.getBoundingClientRect();
          const rectB = b.getBoundingClientRect();
          return rectA.top - rectB.top;
        });
        
        // Check and fix overlaps
        for (let i = 1; i < legends.length; i++) {
          const prevLegend = legends[i-1];
          const currLegend = legends[i];
          
          const prevRect = prevLegend.getBoundingClientRect();
          const currRect = currLegend.getBoundingClientRect();
          
          // Check if overlapping
          if (!(prevRect.right < currRect.left || 
              prevRect.left > currRect.right || 
              prevRect.bottom < currRect.top || 
              prevRect.top > currRect.bottom)) {
            
            // Get current transform
            const transform = currLegend.getAttribute('transform') || '';
            const match = transform.match(/translate\\(([^,]+),\\s*([^)]+)\\)/);
            
            if (match) {
              let x = parseFloat(match[1]);
              let y = parseFloat(match[2]);
              
              // Move down by the height of previous legend plus padding
              y = prevRect.bottom - svgRect.top + 10;
              
              // Apply new position
              currLegend.setAttribute('transform', \`translate(\${x}, \${y})\`);
            }
          }
        }
      }
      
      // Run legend fixes on load
      function runLegendFixes() {
        makeLegendsDraggable();
        fixLegendOverlaps();
      }
      
      // Run after a slight delay to ensure plots are loaded
      setTimeout(runLegendFixes, 1000);
      
      // Also run when window resizes (plots might rerender)
      window.addEventListener('resize', function() {
        setTimeout(runLegendFixes, 500);
      });
      
      // If using Plotly, hook into its events
      if (window.Plotly) {
        const originalPlot = window.Plotly.newPlot;
        window.Plotly.newPlot = function() {
          const result = originalPlot.apply(this, arguments);
          setTimeout(runLegendFixes, 500);
          return result;
        };
      }
    `;

    iframeDocument.body.appendChild(legendScript);

    // Handle specific cases based on visualization type
    handleSpecialCases(iframe);

    // Add right-click context menu for legends
    addLegendContextMenu(iframe);
  } catch (error) {
    console.warn("Could not apply legend fixes to iframe:", error);
  }
}

// Main dashboard initialization function
function initDashboard() {
  // Define visualizations to include in the dashboard - updated with all files from screenshot
  const visualizations = [
    {
      title: "Fraud Analysis Summary",
      filename: "fraud_analysis_output/fraud_analysis_summary.html",
      category: "comparison",
    },
    {
      title: "Fraud Dashboard",
      filename: "fraud_analysis_output/fraud_dashboard.html",
      category: "overview",
    },
    {
      title: "Hourly Analysis",
      filename: "fraud_analysis_output/hourly_analysis.html",
      category: "time",
    },
    {
      title: "Day of Week Analysis",
      filename: "fraud_analysis_output/day_of_week_analysis.html",
      category: "time",
    },
    {
      title: "Fraud Classification Treemap",
      filename: "fraud_analysis_output/fraud_classification_treemap.html",
      category: "channel",
    },
    {
      title: "Daily Transactions and Amounts by Channel",
      filename:
        "fraud_analysis_output/daily_transactions_and_amounts_by_channel.html",
      category: "channel",
    },
    {
      title: "Advanced Pattern Analysis",
      filename: "fraud_analysis_output/advanced_pattern_analysis.html",
      category: "transaction",
    },
    {
      title: "Card & Device Analysis",
      filename: "fraud_analysis_output/card_device_analysis.html",
      category: "transaction",
    },
    {
      title: "Class Analysis",
      filename: "fraud_analysis_output/class_analysis.html",
      category: "demographics",
    },
    {
      title: "Gender Analysis",
      filename: "fraud_analysis_output/gender_analysis.html",
      category: "demographics",
    },
    {
      title: "Region Analysis",
      filename: "fraud_analysis_output/region_analysis.html",
      category: "demographics",
    },
    {
      title: "Subchannel Analysis",
      filename: "fraud_analysis_output/subchannel_analysis.html",
      category: "channel",
    },
    {
      title: "Beneficiary Analysis",
      filename: "fraud_analysis_output/beneficiary_analysis.html",
      category: "transaction",
    },
    {
      title: "Sub Transaction Type Analysis",
      filename: "fraud_analysis_output/sub_transaction_type_analysis.html",
      category: "transaction",
    },
    {
      title: "Transaction Type Analysis",
      filename: "fraud_analysis_output/transaction_type_analysis.html",
      category: "transaction",
    },
    {
      title: "Account Opening Analysis",
      filename: "fraud_analysis_output/account_opening_analysis.html",
      category: "transaction",
    },
    {
      title: "First Contact Method Analysis",
      filename: "fraud_analysis_output/first_contact_method_analysis.html",
      category: "demographics",
    },
    {
      title: "Fraud Velocity Analysis",
      filename: "fraud_analysis_output/fraud_velocity_analysis.html",
      category: "time",
    },
    {
      title: "Monthly Comparison Dashboard",
      filename: "fraud_analysis_output/monthly_comparison_dashboard.html",
      category: "comparison",
    },
    {
      title: "Period Comparison",
      filename: "fraud_analysis_output/period_comparison.html",
      category: "comparison",
    },
  ];

  // Create visualization links in the overview section
  const visualizationLinksContainer = document.querySelector(
    ".visualization-links"
  );
  visualizationLinksContainer.innerHTML = "";

  visualizations.forEach((viz, index) => {
    const link = document.createElement("div");
    link.className = "visualization-link";
    link.dataset.category = viz.category;

    link.innerHTML = `
      <a href="#" onclick="openTab('tab${index}'); return false;">${
      viz.title
    }</a>
      <p>${getVisualizationDescription(viz.title)}</p>
    `;

    visualizationLinksContainer.appendChild(link);
  });

  // Create tab buttons
  const tabsContainer = document.querySelector(".tabs");
  tabsContainer.innerHTML = "";

  visualizations.forEach((viz, index) => {
    const button = document.createElement("button");
    button.className = index === 0 ? "tab-button active" : "tab-button";
    button.textContent = viz.title;
    button.dataset.category = viz.category;
    button.setAttribute("onclick", `openTab('tab${index}')`);

    tabsContainer.appendChild(button);
  });

  // Create tab contents
  const tabContentsContainer = document.querySelector(".tab-contents");
  tabContentsContainer.innerHTML = "";

  visualizations.forEach((viz, index) => {
    const tabContent = document.createElement("div");
    tabContent.id = `tab${index}`;
    tabContent.className = index === 0 ? "tab-content active" : "tab-content";

    tabContent.innerHTML = `
      <div class="plot-title">${viz.title}</div>
      <div class="plot-description">
          ${getVisualizationDescription(viz.title)}
      </div>
      <div class="legend-fix-note">
          <strong>Interactive Elements:</strong> You can click and drag legends to reposition them if they overlap. Right-click on legends for additional options.
      </div>
      <iframe src="${
        viz.filename
      }" class="visualization-frame" id="frame${index}" data-viz-id="${index}"></iframe>
    `;

    tabContentsContainer.appendChild(tabContent);

    // Get the iframe we just created
    const iframe = tabContent.querySelector(`#frame${index}`);

    // Show loading spinner immediately
    showLoadingSpinner(iframe);

    // Add event listeners for loading and loaded states
    iframe.addEventListener("load", function () {
      // Hide spinner when iframe loads
      hideLoadingSpinner(this);

      // Apply legend fix after iframe is loaded
      applyLegendFix(this);
    });
  });

  // Store tab information for later use
  allTabs = Array.from(document.querySelectorAll(".tab-button")).map(
    (button, index) => ({
      index,
      id: "tab" + index,
      title: button.textContent,
      category: button.dataset.category,
      element: button,
    })
  );

  // Setup initial tab
  openTab("tab0");

  // Setup iframe event listeners
  setupIframeEventListeners();
}

// Function to get a description based on the visualization title
function getVisualizationDescription(title) {
  title = title.toLowerCase();

  if (title.includes("dashboard") || title.includes("summary")) {
    return "Overview of key fraud metrics and patterns";
  } else if (title.includes("daily") && title.includes("transaction")) {
    return "Analysis of daily transaction patterns and amounts";
  } else if (title.includes("channel")) {
    return "Distribution of fraud across different banking channels";
  } else if (title.includes("classification") || title.includes("treemap")) {
    return "Breakdown of different fraud types and classifications";
  } else if (title.includes("hour") || title.includes("time")) {
    return "Fraud activity patterns by time of day";
  } else if (title.includes("day") && title.includes("week")) {
    return "Fraud patterns across different days of the week";
  } else if (title.includes("beneficiary")) {
    return "Analysis of fraud by beneficiary types";
  } else if (title.includes("comparison")) {
    return "Comparative analysis of fraud metrics between different periods";
  } else if (title.includes("device") || title.includes("card")) {
    return "Fraud patterns based on device and card types used";
  } else if (title.includes("region")) {
    return "Geographic distribution of fraud cases";
  } else if (title.includes("gender")) {
    return "Analysis of fraud cases by client gender";
  } else if (title.includes("velocity")) {
    return "Analysis of fraud transaction velocity and frequency";
  } else if (title.includes("class")) {
    return "Fraud distribution by client classification";
  } else if (title.includes("account opening")) {
    return "Fraud cases related to account opening mechanisms";
  } else if (title.includes("month")) {
    return "Monthly comparison of fraud patterns and trends";
  } else if (title.includes("period")) {
    return "Comparison of fraud metrics between different time periods";
  } else if (title.includes("subchannel")) {
    return "Detailed analysis of fraud by banking sub-channels";
  } else if (
    title.includes("transaction type") ||
    title.includes("sub transaction")
  ) {
    return "Fraud distribution by transaction types";
  } else if (title.includes("pattern") || title.includes("advanced")) {
    return "Analysis of complex fraud patterns and relationships";
  } else if (title.includes("contact method")) {
    return "Analysis of fraud cases by first contact methods";
  } else {
    return "Detailed fraud analysis and visualization";
  }
}

// Function to handle special cases of problematic visualizations
function handleSpecialCases(iframe) {
  try {
    const iframeDocument = iframe.contentWindow.document;
    const url = iframe.src.toLowerCase();

    // For visualizations with problematic legends, add specific fixes
    if (
      url.includes("hourly_analysis") ||
      url.includes("fraud_by_hour") ||
      url.includes("hour_of_day") ||
      url.includes("velocity")
    ) {
      // Time series with multiple legends - ensure they don't overlap
      const styleElement = iframeDocument.createElement("style");
      styleElement.textContent = `
        /* Position legends on the right for time series */
        .legend {
          position: absolute !important;
          right: 150px !important;
          top: 30px !important;
          cursor: move !important;
          pointer-events: all !important;
        }
        .legend text {
            text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white;
        }
        /* Add right margin to make room for legend */
        .plot-container {
            margin-right: 150px !important;
        }
      `;
      iframeDocument.head.appendChild(styleElement);

      // Add draggable functionality
      const scriptElement = iframeDocument.createElement("script");
      scriptElement.textContent = `
        setTimeout(() => {
          const legends = document.querySelectorAll('.legend');
          legends.forEach(legend => {
            if (!legend.getAttribute('data-draggable')) {
              makeElementDraggable(legend);
              legend.setAttribute('data-draggable', 'true');
            }
          });
        }, 1000);
      `;
      iframeDocument.body.appendChild(scriptElement);
    } else if (
      (url.includes("channel") || url.includes("advanced_pattern")) &&
      (url.includes("beneficiary") || url.includes("transaction"))
    ) {
      // Complex hierarchical visualizations - adjust legend positions
      const styleElement = iframeDocument.createElement("style");
      styleElement.textContent = `
        /* Ensure legends don't get cut off */
        svg {
            overflow: visible !important;
        }
        /* Add space for legends */
        .plot-container {
            margin-right: 15% !important;
        }
        .legend {
            cursor: move !important;
            pointer-events: all !important;
        }
      `;
      iframeDocument.head.appendChild(styleElement);

      // Add draggable functionality
      const scriptElement = iframeDocument.createElement("script");
      scriptElement.textContent = `
        setTimeout(() => {
          const legends = document.querySelectorAll('.legend');
          legends.forEach(legend => {
            if (!legend.getAttribute('data-draggable')) {
              makeElementDraggable(legend);
              legend.setAttribute('data-draggable', 'true');
            }
          });
        }, 1000);
      `;
      iframeDocument.body.appendChild(scriptElement);
    } else if (
      url.includes("treemap") ||
      url.includes("classification") ||
      url.includes("region") ||
      url.includes("card_device")
    ) {
      // Tree maps and other complex visualizations
      const styleElement = iframeDocument.createElement("style");
      styleElement.textContent = `
        /* Fix for treemap-like visualizations */
        .treemap-container {
            width: 90% !important;
        }
        /* Ensure text is readable */
        .treemap-label, .node text, .legend text {
            font-size: 11px !important;
            text-shadow: 1px 1px 0 white, -1px 1px 0 white, 1px -1px 0 white, -1px -1px 0 white;
        }
        .legend {
            cursor: move !important;
            pointer-events: all !important;
        }
      `;
      iframeDocument.head.appendChild(styleElement);

      // Add draggable functionality
      const scriptElement = iframeDocument.createElement("script");
      scriptElement.textContent = `
        setTimeout(() => {
          const legends = document.querySelectorAll('.legend');
          legends.forEach(legend => {
            if (!legend.getAttribute('data-draggable')) {
              makeElementDraggable(legend);
              legend.setAttribute('data-draggable', 'true');
            }
          });
        }, 1000);
      `;
      iframeDocument.body.appendChild(scriptElement);
    }

    // General fix for all visualizations to improve legend visibility
    const generalStyleElement = iframeDocument.createElement("style");
    generalStyleElement.textContent = `
      /* Make all legends more visible with background */
      .legend {
        background-color: rgba(255, 255, 255, 0.7) !important;
        padding: 3px !important;
        border-radius: 3px !important;
        cursor: move !important;
        pointer-events: all !important;
      }
      
      /* Fix for charts with horizontal legend layouts */
      .legend-horizontal {
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        padding: 5px 0 !important;
      }
      
      /* Fix for right-aligned legends */
      svg {
        margin-right: 30px !important;
        overflow: visible !important;
      }
    `;
    iframeDocument.head.appendChild(generalStyleElement);

    // Add script to make all legends draggable and setup context menu
    const generalScriptElement = iframeDocument.createElement("script");
    generalScriptElement.textContent = `
      setTimeout(() => {
        const legends = document.querySelectorAll('.legend');
        legends.forEach(legend => {
          if (!legend.getAttribute('data-draggable')) {
            makeElementDraggable(legend);
            legend.setAttribute('data-draggable', 'true');
            
            // Add context menu functionality
            legend.addEventListener('contextmenu', function(e) {
              e.preventDefault();
              
              // Remove any existing context menus
              const existingMenu = document.getElementById('legend-context-menu');
              if (existingMenu) {
                existingMenu.remove();
              }
              
              // Create and show context menu
              const menu = document.createElement('div');
              menu.id = 'legend-context-menu';
              menu.style.position = 'absolute';
              menu.style.left = e.pageX + 'px';
              menu.style.top = e.pageY + 'px';
              menu.style.background = 'white';
              menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
              menu.style.borderRadius = '4px';
              menu.style.padding = '5px 0';
              menu.style.zIndex = '1000';
              
              // Add menu items
              const options = [
                {text: 'Move to Top Right', action: () => legend.setAttribute('transform', 'translate(' + (document.body.clientWidth - 150) + ', 20)')},
                {text: 'Move to Top Left', action: () => legend.setAttribute('transform', 'translate(20, 20)')},
                {text: 'Move to Bottom Left', action: () => legend.setAttribute('transform', 'translate(20, ' + (document.body.clientHeight - 100) + ')')},
                {text: 'Move to Bottom Right', action: () => legend.setAttribute('transform', 'translate(' + (document.body.clientWidth - 150) + ', ' + (document.body.clientHeight - 100) + ')')},
                {text: 'Hide Legend', action: () => legend.style.display = 'none'},
                {text: 'Show All Legends', action: () => document.querySelectorAll('.legend').forEach(l => l.style.display = '')}
              ];
              
              options.forEach(option => {
                const item = document.createElement('div');
                item.textContent = option.text;
                item.style.padding = '8px 12px';
                item.style.cursor = 'pointer';
                item.style.fontSize = '14px';
                
                item.addEventListener('mouseenter', () => {
                  item.style.background = '#f0f0f0';
                });
                
                item.addEventListener('mouseleave', () => {
                  item.style.background = 'white';
                });
                
                item.addEventListener('click', () => {
                  option.action();
                  menu.remove();
                });
                
                menu.appendChild(item);
              });
              
              document.body.appendChild(menu);
              
              // Close menu when clicking elsewhere
              document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
              });
            });
          }
        });
      }, 1000);
    `;
    iframeDocument.body.appendChild(generalScriptElement);
  } catch (error) {
    console.warn("Could not apply special case handlers:", error);
  }
}

// Add context menu for advanced legend options
function addLegendContextMenu(iframe) {
  try {
    const iframeDocument = iframe.contentWindow.document;

    // Add context menu script
    const scriptElement = iframeDocument.createElement("script");
    scriptElement.textContent = `
      function setupLegendContextMenu() {
        const legends = document.querySelectorAll('.legend');
        legends.forEach(legend => {
          legend.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            
            // Remove any existing context menus
            const existingMenu = document.getElementById('legend-context-menu');
            if (existingMenu) {
              existingMenu.remove();
            }
            
            // Create context menu
            const menu = document.createElement('div');
            menu.id = 'legend-context-menu';
            menu.style.position = 'absolute';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            menu.style.background = 'white';
            menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            menu.style.borderRadius = '4px';
            menu.style.padding = '5px 0';
            menu.style.zIndex = '1000';
            
            // Add menu items
            const options = [
              {text: 'Move to Top Right', action: () => legend.setAttribute('transform', 'translate(' + (document.body.clientWidth - 150) + ', 20)')},
              {text: 'Move to Top Left', action: () => legend.setAttribute('transform', 'translate(20, 20)')},
              {text: 'Move to Bottom Left', action: () => legend.setAttribute('transform', 'translate(20, ' + (document.body.clientHeight - 100) + ')')},
              {text: 'Move to Bottom Right', action: () => legend.setAttribute('transform', 'translate(' + (document.body.clientWidth - 150) + ', ' + (document.body.clientHeight - 100) + ')')},
              {text: 'Hide Legend', action: () => legend.style.display = 'none'},
              {text: 'Show All Legends', action: () => document.querySelectorAll('.legend').forEach(l => l.style.display = '')}
            ];
            
            options.forEach(option => {
              const item = document.createElement('div');
              item.textContent = option.text;
              item.style.padding = '8px 12px';
              item.style.cursor = 'pointer';
              item.style.fontSize = '14px';
              
              item.addEventListener('mouseenter', () => {
                item.style.background = '#f0f0f0';
              });
              
              item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
              });
              
              item.addEventListener('click', () => {
                option.action();
                menu.remove();
              });
              
              menu.appendChild(item);
            });
            
            document.body.appendChild(menu);
            
            // Close menu when clicking elsewhere
            document.addEventListener('click', function closeMenu() {
              menu.remove();
              document.removeEventListener('click', closeMenu);
            });
          });
        });
      }
      
      // Run after a delay to ensure elements are loaded
      setTimeout(setupLegendContextMenu, 1500);
      
      // Also run when window resizes
      window.addEventListener('resize', function() {
        setTimeout(setupLegendContextMenu, 500);
      });
    `;

    iframeDocument.body.appendChild(scriptElement);
  } catch (error) {
    console.warn("Could not add legend context menu:", error);
  }
}

// Tab switching functionality
function openTab(tabId) {
  // Hide all tab contents
  const tabContents = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContents.length; i++) {
    tabContents[i].classList.remove("active");
  }

  // Remove active class from all tab buttons
  const tabButtons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }

  // Show the selected tab content
  document.getElementById(tabId).classList.add("active");

  // Add active class to the clicked button
  const activeTabIndex = parseInt(tabId.replace("tab", ""));
  tabButtons[activeTabIndex].classList.add("active");

  // Ensure the tab is visible if it was hidden by search
  tabButtons[activeTabIndex].style.display = "block";

  // Scroll to the top of the content
  window.scrollTo({
    top: document.querySelector(".tabs").offsetTop - 20,
    behavior: "smooth",
  });

  // Force iframe reload to ensure proper rendering
  const activeFrame = document.querySelector(`#${tabId} iframe`);
  if (activeFrame) {
    // Only reload if tab is being viewed for the first time
    if (!activeFrame.getAttribute("data-loaded")) {
      // Show loading spinner
      showLoadingSpinner(activeFrame);

      // Store current src
      const currentSrc = activeFrame.src;
      // Clear and reset src to force reload
      activeFrame.src = "";
      setTimeout(() => {
        activeFrame.src = currentSrc;
        activeFrame.setAttribute("data-loaded", "true");
      }, 50);
    }
  }
}

// Function to show loading spinner when iframe is loading
function showLoadingSpinner(iframe) {
  // Create a spinner container if it doesn't exist
  let spinnerContainer = iframe.parentNode.querySelector(".spinner-container");

  if (!spinnerContainer) {
    spinnerContainer = document.createElement("div");
    spinnerContainer.className = "spinner-container";

    // Create the spinner element
    const spinner = document.createElement("div");
    spinner.className = "spinner";

    // Create loading text
    const loadingText = document.createElement("div");
    loadingText.className = "loading-text";
    loadingText.textContent = "Loading visualization...";

    // Append elements to container
    spinnerContainer.appendChild(spinner);
    spinnerContainer.appendChild(loadingText);

    // Insert spinner container before the iframe in DOM
    iframe.parentNode.insertBefore(spinnerContainer, iframe);
  }

  // Show spinner and hide iframe until loaded
  spinnerContainer.style.display = "flex";
  iframe.style.opacity = "0";
}

// Function to add category reset button to search container
function addCategoryResetButton() {
  // Create a container for the current category display and reset button
  const categoryIndicator = document.createElement("div");
  categoryIndicator.className = "current-category-indicator";
  categoryIndicator.id = "currentCategoryIndicator";

  // Create the text label
  const categoryLabel = document.createElement("span");
  categoryLabel.className = "category-label";
  categoryLabel.textContent = "Current Category: All";

  // Create the reset button
  const resetButton = document.createElement("button");
  resetButton.className = "category-reset-button";
  resetButton.innerHTML = "Show All Categories";
  resetButton.title = "Reset to show all categories";
  resetButton.onclick = function () {
    filterByCategory("all");
    updateCategoryIndicator("all");
  };

  // Add the elements to the container
  categoryIndicator.appendChild(categoryLabel);
  categoryIndicator.appendChild(resetButton);

  // Find the search container to add our new element
  const searchContainer = document.querySelector(".search-container");
  const searchInput = document.getElementById("searchInput");

  // Insert the category indicator after the search input
  searchContainer.insertBefore(categoryIndicator, searchInput.nextSibling);

  // Initially hide the reset button since we start on "All"
  resetButton.style.display = "none";
}

// Function to update the category indicator when category changes
function updateCategoryIndicator(category) {
  const indicator = document.getElementById("currentCategoryIndicator");
  if (!indicator) return;

  const categoryLabel = indicator.querySelector(".category-label");
  const resetButton = indicator.querySelector(".category-reset-button");

  // Format the category name (capitalize first letter)
  let displayName = category;
  if (category !== "all") {
    displayName = category.charAt(0).toUpperCase() + category.slice(1);
  } else {
    displayName = "All";
  }

  // Update the label
  categoryLabel.textContent = `Current Category: ${displayName}`;

  // Show/hide reset button based on category
  if (category === "all") {
    resetButton.style.display = "none";
  } else {
    resetButton.style.display = "block";
  }

  // Add highlight animation
  indicator.classList.remove("category-highlight");
  void indicator.offsetWidth; // Trigger reflow
  indicator.classList.add("category-highlight");
}

// Function to hide loading spinner when iframe is loaded
function hideLoadingSpinner(iframe) {
  const spinnerContainer =
    iframe.parentNode.querySelector(".spinner-container");

  if (spinnerContainer) {
    // Add fade-out class to spinner
    spinnerContainer.classList.add("fade-out");

    // Show iframe with fade-in effect
    iframe.style.transition = "opacity 0.5s";
    iframe.style.opacity = "1";

    // Remove spinner after animation completes
    setTimeout(() => {
      spinnerContainer.style.display = "none";
    }, 500);
  }
}

// Navigate between tabs
function navigateTabs(direction) {
  // Find the active tab
  const activeTab = document.querySelector(".tab-content.active");
  const activeTabId = activeTab.id;
  const currentIndex = parseInt(activeTabId.replace("tab", ""));

  // Get all visible tabs (not hidden by search or category filter)
  const visibleTabs = Array.from(document.querySelectorAll(".tab-button"))
    .filter((button) => button.style.display !== "none")
    .map((button) =>
      parseInt(button.getAttribute("onclick").match(/tab(\d+)/)[1])
    );

  if (visibleTabs.length === 0) return; // No visible tabs

  // Find current index in visible tabs array
  const currentVisibleIndex = visibleTabs.indexOf(currentIndex);

  let nextIndex;
  if (direction > 0) {
    // Next tab
    if (
      currentVisibleIndex === -1 ||
      currentVisibleIndex === visibleTabs.length - 1
    ) {
      nextIndex = visibleTabs[0]; // Wrap to first
    } else {
      nextIndex = visibleTabs[currentVisibleIndex + 1];
    }
  } else {
    // Previous tab
    if (currentVisibleIndex === -1 || currentVisibleIndex === 0) {
      nextIndex = visibleTabs[visibleTabs.length - 1]; // Wrap to last
    } else {
      nextIndex = visibleTabs[currentVisibleIndex - 1];
    }
  }

  // Open the next tab
  openTab("tab" + nextIndex);
}

// Search functionality
function searchVisualizations() {
  const input = document.getElementById("searchInput");
  const filter = input.value.toLowerCase().trim();
  const noResultsElement = document.getElementById("noResults");
  const buttons = document.getElementsByClassName("tab-button");
  const links = document.getElementsByClassName("visualization-link");

  let hasVisibleTabs = false;

  // Handle empty search
  if (filter === "") {
    // Show all tabs that match the current category filter
    const activeCategoryButton = document.querySelector(
      ".category-button.active"
    );
    const activeCategory = activeCategoryButton
      ? activeCategoryButton
          .getAttribute("onclick")
          .match(/['"]([^'"]+)['"]/)[1]
      : "all";

    for (let i = 0; i < buttons.length; i++) {
      const shouldShow =
        activeCategory === "all" ||
        buttons[i].dataset.category === activeCategory;
      buttons[i].style.display = shouldShow ? "block" : "none";
      hasVisibleTabs = hasVisibleTabs || shouldShow;
    }

    // Also filter the links
    for (let i = 0; i < links.length; i++) {
      const shouldShow =
        activeCategory === "all" ||
        links[i].dataset.category === activeCategory;
      links[i].style.display = shouldShow ? "block" : "none";
    }
  } else {
    // Filter based on search text and category
    const activeCategoryButton = document.querySelector(
      ".category-button.active"
    );
    const activeCategory = activeCategoryButton
      ? activeCategoryButton
          .getAttribute("onclick")
          .match(/['"]([^'"]+)['"]/)[1]
      : "all";

    for (let i = 0; i < buttons.length; i++) {
      const text = buttons[i].textContent.toLowerCase();
      const matchesSearch = text.includes(filter);
      const matchesCategory =
        activeCategory === "all" ||
        buttons[i].dataset.category === activeCategory;
      const shouldShow = matchesSearch && matchesCategory;

      buttons[i].style.display = shouldShow ? "block" : "none";
      hasVisibleTabs = hasVisibleTabs || shouldShow;
    }

    // Also filter the links
    for (let i = 0; i < links.length; i++) {
      const text = links[i].querySelector("a").textContent.toLowerCase();
      const matchesSearch = text.includes(filter);
      const matchesCategory =
        activeCategory === "all" ||
        links[i].dataset.category === activeCategory;
      const shouldShow = matchesSearch && matchesCategory;

      links[i].style.display = shouldShow ? "block" : "none";
    }
  }

  // Show or hide no results message
  noResultsElement.style.display = hasVisibleTabs ? "none" : "block";

  // If active tab is hidden, switch to first visible tab
  const activeTab = document.querySelector(".tab-button.active");
  if (!activeTab || activeTab.style.display === "none") {
    // Find first visible tab
    const firstVisibleTab = Array.from(buttons).find(
      (button) => button.style.display !== "none"
    );

    if (firstVisibleTab) {
      // Get its index and open that tab
      const index = Array.from(buttons).indexOf(firstVisibleTab);
      openTab("tab" + index);
    }
  }
}

// Filter by category
function filterByCategory(category) {
  // Update active button
  const categoryButtons = document.querySelectorAll(".category-button");
  categoryButtons.forEach((button) => {
    if (button.getAttribute("onclick").includes(category)) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });

  // Clear search field
  const searchInput = document.getElementById("searchInput");
  searchInput.value = "";

  // Filter tabs by category
  const tabButtons = document.querySelectorAll(".tab-button");
  let hasVisibleTabs = false;

  tabButtons.forEach((button) => {
    const shouldShow =
      category === "all" || button.dataset.category === category;
    button.style.display = shouldShow ? "block" : "none";
    hasVisibleTabs = hasVisibleTabs || shouldShow;
  });

  // Filter visualization links
  const links = document.querySelectorAll(".visualization-link");
  links.forEach((link) => {
    const shouldShow = category === "all" || link.dataset.category === category;
    link.style.display = shouldShow ? "block" : "none";
  });

  // Show or hide no results message
  document.getElementById("noResults").style.display = hasVisibleTabs
    ? "none"
    : "block";

  // If current active tab is hidden, switch to first visible tab
  const activeTab = document.querySelector(".tab-button.active");
  if (!activeTab || activeTab.style.display === "none") {
    const firstVisibleTab = Array.from(tabButtons).find(
      (button) => button.style.display !== "none"
    );

    if (firstVisibleTab) {
      const tabId = firstVisibleTab
        .getAttribute("onclick")
        .match(/openTab\('(tab\d+)'\)/)[1];
      openTab(tabId);
    }
  }

  // Update URL parameters without refreshing
  const url = new URL(window.location);
  url.searchParams.set("category", category);
  window.history.replaceState({}, "", url);

  updateCategoryIndicator(category);
}

// Setup event listeners for iframe loads
function setupIframeEventListeners() {
  const frames = document.querySelectorAll(".visualization-frame");
  frames.forEach((frame) => {
    frame.addEventListener("load", function () {
      applyLegendFix(this);
    });
  });
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initDashboard();
  addCategoryResetButton();
});
