import assert from 'assert';
import test from 'selenium-webdriver/testing';
import config from 'config';

import LoginFlow from '../lib/flows/login-flow.js';

import EditorPage from '../lib/pages/editor-page.js';
import ViewPagePage from '../lib/pages/view-page-page.js';
import NotFoundPage from '../lib/pages/not-found-page.js';

import PagePreviewComponent from '../lib/components/page-preview-component.js';
import PostEditorSidebarComponent from '../lib/components/post-editor-sidebar-component.js';

import * as driverManager from '../lib/driver-manager.js';
import * as mediaHelper from '../lib/media-helper.js';
import * as dataHelper from '../lib/data-helper.js';

const mochaTimeOut = config.get( 'mochaTimeoutMS' );
const startBrowserTimeoutMS = config.get( 'startBrowserTimeoutMS' );
const screenSize = driverManager.currentScreenSize();

var driver;

test.before( 'Start Browser', function() {
	this.timeout( startBrowserTimeoutMS );
	driver = driverManager.startBrowser();
} );

test.describe( 'Editor: Pages (' + screenSize + ')', function() {
	this.timeout( mochaTimeOut );

	test.describe( 'Public Pages:', function() {
		this.bailSuite( true );
		let fileDetails;

		test.before( 'Delete Cookies and Local Storage', function() {
			return driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		test.before( 'Create image file for upload', function() {
			return mediaHelper.createFile().then( function( details ) {
				fileDetails = details;
			} );
		} );

		test.describe( 'Preview and Publish a Public Page', function() {
			var pageTitle = dataHelper.randomPhrase();
			var pageQuote = 'If you have the same problem for a long time, maybe it’s not a problem. Maybe it’s a fact..\n— Itzhak Rabin';

			test.it( 'Can log in', function() {
				let loginFlow = new LoginFlow( driver );
				loginFlow.loginAndStartNewPage();
			} );

			test.it( 'Can enter page title, content and image', function() {
				let editorPage = new EditorPage( driver );
				editorPage.enterTitle( pageTitle );
				editorPage.enterContent( pageQuote + '\n' );
				editorPage.enterPostImage( fileDetails );
				return editorPage.waitUntilImageInserted( fileDetails );
			} );

			test.it( 'Can disable sharing buttons', function() {
				let postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
				postEditorSidebarComponent.expandSharingSection();
				postEditorSidebarComponent.setSharingButtons( false );
				postEditorSidebarComponent.closeSharingSection();
			} );

			test.describe( 'Preview', function() {
				test.it( 'Can launch page preview', function() {
					let postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
// wp-calypso issue#6612		postEditorSidebarComponent.ensureSaved();
					postEditorSidebarComponent.launchPreview();
					this.pagePreviewComponent = new PagePreviewComponent( driver );
				} );

				test.it( 'Can see correct page title in preview', function() {
					this.pagePreviewComponent.pageTitle().then( function( actualPageTitle ) {
						assert.equal( actualPageTitle.toUpperCase(), pageTitle.toUpperCase(), 'The page preview title is not correct' );
					} );
				} );

				test.it( 'Can see correct page content in preview', function() {
					this.pagePreviewComponent.pageContent().then( function( content ) {
						assert.equal( content.indexOf( pageQuote ) > -1, true, 'The page preview content (' + content + ') does not include the expected content (' + pageQuote + ')' );
					} );
				} );

				test.it( 'Can see the image uploaded in the preview', function() {
					this.pagePreviewComponent.imageDisplayed( fileDetails ).then( ( imageDisplayed ) => {
						assert.equal( imageDisplayed, true, 'Could not see the image in the web preview' );
					} );
				} );

				test.after( 'Can close page preview', function() {
					this.pagePreviewComponent.close();
				} );
			} );

			test.describe( 'Publish and View', function() {
				test.it( 'Can publish and view content', function() {
					this.postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
					this.postEditorSidebarComponent.publishAndViewContent();
					this.viewPagePage = new ViewPagePage( driver );
				} );

				test.it( 'Can see correct page title', function() {
					this.viewPagePage.pageTitle().then( function( actualPageTitle ) {
						assert.equal( actualPageTitle.toUpperCase(), pageTitle.toUpperCase(), 'The published blog page title is not correct' );
					} );
				} );

				test.it( 'Can see correct page content', function() {
					this.viewPagePage.pageContent().then( function( content ) {
						assert.equal( content.indexOf( pageQuote ) > -1, true, 'The page content (' + content + ') does not include the expected content (' + pageQuote + ')' );
					} );
				} );

				test.it( 'Can\'t see sharing buttons', function() {
					this.viewPagePage.sharingButtonsVisible().then( function( visible ) {
						assert.equal( visible, false, 'Sharing buttons are shown even though they were disabled when creating the page.' );
					} );
				} );

				test.it( 'Can see the image uploaded displayed', function() {
					this.viewPagePage.imageDisplayed( fileDetails ).then( ( imageDisplayed ) => {
						assert.equal( imageDisplayed, true, 'Could not see the image in the published page' );
					} );
				} );
			} );
		} );

		test.after( function() {
			if ( fileDetails ) {
				mediaHelper.deleteFile( fileDetails ).then( function() {} );
			}
		} );
	} );

	test.describe( 'Private Pages:', function() {
		this.bailSuite( true );
		test.before( 'Delete Cookies and Local Storage', function() {
			driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		test.describe( 'Publish a Private Page', function() {
			var pageTitle = dataHelper.randomPhrase();
			var pageQuote = 'Few people know how to take a walk. The qualifications are endurance, plain clothes, old shoes, an eye for nature, good humor, vast curiosity, good speech, good silence and nothing too much.\n— Ralph Waldo Emerson\n';

			test.it( 'Can log in', function() {
				let loginFlow = new LoginFlow( driver );
				loginFlow.loginAndStartNewPage();
			} );

			test.it( 'Can enter page title and content', function() {
				let editorPage = new EditorPage( driver );
				editorPage.enterTitle( pageTitle );
				editorPage.enterContent( pageQuote );
				let postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
				postEditorSidebarComponent.ensureSaved();
			} );

			test.it( 'Can set visibility to private', function() {
				if ( config.get( 'useNewMobileEditor' ) === true ) {
					const postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
					postEditorSidebarComponent.setVisibilityToPrivate();
				} else {
					const editorPage = new EditorPage( driver );
					editorPage.setVisibilityToPrivate();
				}
			} );

			test.describe( 'Publish and View', function() {
				test.it( 'Can publish and view content', function() {
					let editorPage = new EditorPage( driver );
					editorPage.viewPublishedPostOrPage();
				} );

				test.it( 'Can view page title as logged in user', function() {
					let viewPagePage = new ViewPagePage( driver );
					viewPagePage.pageTitle().then( function( actualPageTitle ) {
						assert.equal( actualPageTitle.toUpperCase(), ( 'Private: ' + pageTitle ).toUpperCase(), 'The published blog page title is not correct' );
					} );
				} );

				test.it( 'Can view page content as logged in user', function() {
					let viewPagePage = new ViewPagePage( driver );
					viewPagePage.pageContent().then( function( content ) {
						assert.equal( content.indexOf( pageQuote ) > -1, true, 'The page content (' + content + ') does not include the expected content (' + pageQuote + ')' );
					} );
				} );

				test.it( 'Can\'t view page title or content as non-logged in user', function() {
					driver.manage().deleteAllCookies();
					driver.navigate().refresh();

					let notFoundPage = new NotFoundPage( driver );
					notFoundPage.displayed().then( function( displayed ) {
						assert.equal( displayed, true, 'Could not see the not found (404) page. Check that it is displayed' );
					} );
				} );
			} );
		} );
	} );

	test.describe( 'Password Protected Pages:', function() {
		this.bailSuite( true );
		test.before( 'Delete Cookies and Local Storage', function() {
			driverManager.clearCookiesAndDeleteLocalStorage( driver );
		} );

		test.describe( 'Publish a Password Protected Page', function() {
			var pageTitle = dataHelper.randomPhrase();
			var pageQuote = 'If you don’t like something, change it. If you can’t change it, change the way you think about it.\n— Mary Engelbreit\n';
			var postPassword = 'e2e' + new Date().getTime().toString();

			test.it( 'Can log in', function() {
				let loginFlow = new LoginFlow( driver );
				loginFlow.loginAndStartNewPage();
			} );

			test.it( 'Can enter page title and content and set to password protected', function() {
				this.editorPage = new EditorPage( driver );
				this.editorPage.enterTitle( pageTitle );
				if ( config.get( 'useNewMobileEditor' ) === true ) {
					this.postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
					this.postEditorSidebarComponent.setVisibilityToPasswordProtected( postPassword );
				} else {
					this.editorPage = new EditorPage( driver );
					this.editorPage.setVisibilityToPasswordProtected( postPassword );
				}
				this.editorPage = new EditorPage( driver );
				this.editorPage.enterContent( pageQuote );
				this.postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
				this.postEditorSidebarComponent.ensureSaved();
			} );

			test.describe( 'Publish and View', function() {
				test.it( 'Can publish and view content', function() {
					let postEditorSidebarComponent = new PostEditorSidebarComponent( driver );
					postEditorSidebarComponent.publishAndViewContent();
				} );

				test.describe( 'As a logged in user', function() {
					test.describe( 'With no password entered', function() {
						test.it( 'Can view page title', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageTitle().then( function( actualPageTitle ) {
								assert.equal( actualPageTitle.toUpperCase(), ( 'Protected: ' + pageTitle ).toUpperCase() );
							} );
						} );

						test.it( 'Can see password field', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.isPasswordProtected().then( function( isPasswordProtected ) {
								assert.equal( isPasswordProtected, true, 'The page does not appear to be password protected' );
							} );
						} );

						test.it( 'Can\'t see content when no password is entered', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageContent().then( function( content ) {
								assert.equal( content.indexOf( pageQuote ) === -1, true, 'The page content (' + content + ') displays the expected content (' + pageQuote + ') when it should be password protected.' );
							} );
						} );
					} );

					test.describe( 'With incorrect password entered', function() {
						test.it( 'Enter incorrect password', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.enterPassword( 'password' );
						} );

						test.it( 'Can view page title', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageTitle().then( function( actualPageTitle ) {
								assert.equal( actualPageTitle.toUpperCase(), ( 'Protected: ' + pageTitle ).toUpperCase() );
							} );
						} );

						test.it( 'Can see password field', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.isPasswordProtected().then( function( isPasswordProtected ) {
								assert.equal( isPasswordProtected, true, 'The page does not appear to be password protected' );
							} );
						} );

						test.it( 'Can\'t see content when incorrect password is entered', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageContent().then( function( content ) {
								assert.equal( content.indexOf( pageQuote ) === -1, true, 'The page content (' + content + ') displays the expected content (' + pageQuote + ') when it should be password protected.' );
							} );
						} );
					} );

					test.describe( 'With correct password entered', function() {
						test.it( 'Enter correct password', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.enterPassword( postPassword );
						} );

						test.it( 'Can view page title', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageTitle().then( function( actualPageTitle ) {
								assert.equal( actualPageTitle.toUpperCase(), ( 'Protected: ' + pageTitle ).toUpperCase() );
							} );
						} );

						test.it( 'Can\'t see password field', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.isPasswordProtected().then( function( isPasswordProtected ) {
								assert.equal( isPasswordProtected, false, 'The page still seems to be password protected' );
							} );
						} );

						test.it( 'Can see page content', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageContent().then( function( content ) {
								assert.equal( content.indexOf( pageQuote ) > -1, true, 'The page content (' + content + ') does not include the expected content (' + pageQuote + ')' );
							} );
						} );
					} );
				} );
				test.describe( 'As a non-logged in user', function() {
					test.it( 'Clear cookies (log out)', function() {
						driver.manage().deleteAllCookies();
						driver.navigate().refresh();
					} );
					test.describe( 'With no password entered', function() {
						test.it( 'Can view page title', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageTitle().then( function( actualPageTitle ) {
								assert.equal( actualPageTitle.toUpperCase(), ( 'Protected: ' + pageTitle ).toUpperCase() );
							} );
						} );

						test.it( 'Can see password field', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.isPasswordProtected().then( function( isPasswordProtected ) {
								assert.equal( isPasswordProtected, true, 'The page does not appear to be password protected' );
							} );
						} );

						test.it( 'Can\'t see content when no password is entered', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageContent().then( function( content ) {
								assert.equal( content.indexOf( pageQuote ) === -1, true, 'The page content (' + content + ') displays the expected content (' + pageQuote + ') when it should be password protected.' );
							} );
						} );
					} );

					test.describe( 'With incorrect password entered', function() {
						test.it( 'Enter incorrect password', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.enterPassword( 'password' );
						} );

						test.it( 'Can view page title', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageTitle().then( function( actualPageTitle ) {
								assert.equal( actualPageTitle.toUpperCase(), ( 'Protected: ' + pageTitle ).toUpperCase() );
							} );
						} );

						test.it( 'Can see password field', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.isPasswordProtected().then( function( isPasswordProtected ) {
								assert.equal( isPasswordProtected, true, 'The page does not appear to be password protected' );
							} );
						} );

						test.it( 'Can\'t see content when incorrect password is entered', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageContent().then( function( content ) {
								assert.equal( content.indexOf( pageQuote ) === -1, true, 'The page content (' + content + ') displays the expected content (' + pageQuote + ') when it should be password protected.' );
							} );
						} );
					} );

					test.describe( 'With correct password entered', function() {
						test.it( 'Enter correct password', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.enterPassword( postPassword );
						} );

						test.it( 'Can view page title', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageTitle().then( function( actualPageTitle ) {
								assert.equal( actualPageTitle.toUpperCase(), ( 'Protected: ' + pageTitle ).toUpperCase() );
							} );
						} );

						test.it( 'Can\'t see password field', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.isPasswordProtected().then( function( isPasswordProtected ) {
								assert.equal( isPasswordProtected, false, 'The page still seems to be password protected' );
							} );
						} );

						test.it( 'Can see page content', function() {
							let viewPagePage = new ViewPagePage( driver );
							viewPagePage.pageContent().then( function( content ) {
								assert.equal( content.indexOf( pageQuote ) > -1, true, 'The page content (' + content + ') does not include the expected content (' + pageQuote + ')' );
							} );
						} );
					} );
				} );
			} );
		} );
	} );
} );
