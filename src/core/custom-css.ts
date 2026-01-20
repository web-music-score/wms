import { Utils } from "@tspro/ts-utils-lib";

Utils.Dom.injectCss("wms-custom-css", `
/* Add custom wms-button and wms-button-group styles */

.wms-canvas { }

.wms-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.8rem;      /* medium size */
  font-size: 1rem;             /* readable */
  font-weight: 600;            /* semi-bold for clarity */
  cursor: pointer;
  border: 1px solid #444;      /* subtle border */
  border-radius: 4px;           /* slight rounding */
  background-color: #1e88e5;   /* primary color (blue) */
  color: white;                 /* text color */
  transition: background 0.2s ease, transform 0.1s ease;
}

.wms-button:disabled,
.wms-button.disabled {
  background-color: #b0bec5;   /* grayish color */
  border-color: #90a4ae;       /* subtle border */
  color: #eceff1;              /* light text */
  cursor: not-allowed;         /* indicates disabled */
  opacity: 0.7;                /* slightly faded */
  pointer-events: none;        /* prevent clicks */
  transform: none;             /* no press effect */
}

.wms-button:hover {
  background-color: #1565c0;    /* slightly darker */
}

.wms-button:active {
  transform: scale(0.97);       /* subtle press effect */
}

.wms-button--sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
.wms-button--lg { padding: 0.5rem 1rem; font-size: 1.125rem; }

.wms-button-group {
  display: inline-flex;
}

.wms-button-group > .wms-button {
  border-radius: 0;
  margin: 0;
}

.wms-button-group > .wms-button:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.wms-button-group > .wms-button:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Add ifm-button-group for infima (for Docusaurus) */

.ifm-button-group {
    display: inline-flex;
    align-items: stretch;
}

.ifm-button-group > .button {
    border-radius: 0;
    margin: 0;
}

.ifm-button-group > .button:first-child {
    border-top-left-radius: var(--ifm-button-border-radius);
    border-bottom-left-radius: var(--ifm-button-border-radius);
}

.ifm-button-group > .button:last-child {
    border-top-right-radius: var(--ifm-button-border-radius);
    border-bottom-right-radius: var(--ifm-button-border-radius);
}
`);
