import test from 'selenium-webdriver/testing';
import config from 'config';

import * as driverManager from '../lib/driver-manager.js';

import SignUpFlow from '../lib/flows/signup-flow.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );

var driver;

test.before( function() {
	this.timeout( startBrowserTimeoutMS );
	driver = driverManager.startBrowser();
} );

test.describe( 'WordPress.com Sign Up', function() {
	this.timeout( mochaTimeOut );

	test.beforeEach( function() {
		driver.manage().deleteAllCookies();
		driverManager.deleteLocalStorage( driver );
	} );

	test.it( 'Can Create A Free Blog (he) Desktop', function() {
		const signupFlow = new SignUpFlow( driver, 'desktop' );
		signupFlow.createFreeBlogWithScreenshots( 'he' );
	} );

	test.it( 'Can Create A Free Blog (he) Tablet', function() {
		const signupFlow = new SignUpFlow( driver, 'tablet' );
		signupFlow.createFreeBlogWithScreenshots( 'he' );
	} );

	test.it( 'Can Create A Free Blog (he) Mobile', function() {
		const signupFlow = new SignUpFlow( driver, 'mobile' );
		signupFlow.createFreeBlogWithScreenshots( 'he' );
	} );
} );
