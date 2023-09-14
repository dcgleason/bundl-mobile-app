import React, { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Contacts from 'expo-contacts';
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from 'expo-linking';
import { View, Text, TextInput, TouchableOpacity, SectionList, FlatList, Switch, Modal, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PlatformPayButton, isPlatformPaySupported } from '@stripe/stripe-react-native';

import { Dimensions } from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as MailComposer from 'expo-mail-composer';
import * as SMS from 'expo-sms';
import DateTimePicker from '@react-native-community/datetimepicker';




function PaymentModal({ isModalVisible, setIsModalVisible, totalAmount, gifterEmail, setHasPaid, physicalBook, setCity, setState, setZipCode, setStreetAddress }) {
  const { createPaymentMethod, confirmPayment } = useStripe();
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);


  useEffect(() => {
    (async function () {
      setIsApplePaySupported(await isPlatformPaySupported());
    })();
    console.log('isApplePaySupported', isApplePaySupported);
  }, [isPlatformPaySupported]);

  const handlePay = async () => {
    if (!cardDetails?.complete) {
      alert('Please enter complete card details');
      return;
    }
  
    // Create a payment method from the card details
    const { error: paymentMethodError, paymentMethod } = await createPaymentMethod({
      paymentMethodType: 'Card',
      card: cardDetails,
    });
    if (paymentMethodError) {
      console.log('Failed to create payment method:', paymentMethodError.message);
      setIsErrorModalVisible(true);  // Show error modal
      return;
    }
  
    // Create a payment intent on the server
    const response = await fetch('https://yay-api.herokuapp.com/stripe/secret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: gifterEmail,
        amount: totalAmount,
      }),
    });
  
    const data = await response.json();
    console.log('Payment intent created:', data);
  
    // Confirm the payment
    const { error: confirmationError } = await confirmPayment(data.client_secret, {
      paymentMethodType: 'Card',
      paymentMethodId: paymentMethod.id,
    });
  
    if (confirmationError) {
      console.log('Payment confirmation error:', confirmationError.message);
      setIsErrorModalVisible(true);  // Show error modal
    } else {
      // Payment was successful
      console.log('Payment successful');
      setIsModalVisible(false);
      setIsSuccessModalVisible(true);  // Show success modal
      setHasPaid(true);  // The user has paid
    }
  };
  

  

  return (
    <View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isSuccessModalVisible}
          onRequestClose={() => setIsSuccessModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              width: '50%', 
              height: '10%',  // Set the height as desired
              padding: 20, 
              backgroundColor: 'white', 
              borderRadius: 10, 
              borderWidth: 2,  
              borderColor: 'black',  
              justifyContent: 'center',  // Center content vertically
              alignItems: 'center'  // Center content horizontally
            }}>
              <Text>Payment successful.</Text>
              <TouchableOpacity style={styles.button} onPress={() => setIsSuccessModalVisible(false)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Error Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isErrorModalVisible}
          onRequestClose={() => setIsErrorModalVisible(false)}
        >
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ 
              width: '50%', 
              height: '10%',  // Set the height as desired
              padding: 20, 
              backgroundColor: 'white', 
              borderRadius: 10, 
              borderWidth: 2,  
              borderColor: 'black',  
              justifyContent: 'center',  // Center content vertically
              alignItems: 'center'  // Center content horizontally
            }}>
              <Text>Payment failed. Please try again.</Text>
              <TouchableOpacity style={styles.button} onPress={() => setIsErrorModalVisible(false)}>
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    
        <StripeProvider
            publishableKey="pk_test_51KtCf1LVDYVdzLHCzEQuGuw08kKelgXO7AgN6VDN874gIPxfr7dl7PvcNgUZUSnypEOxqJcMCu4G119l0MQixCkj00Rr1fOuls"
            urlScheme="com.googleusercontent.apps.764289968872-8spc0amg0j9n4lqjs0rr99s75dmmkpc7"
            merchantIdentifier="merchant.givebundl"
        >
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ 
                width: '80%', 
                padding: 20, 
                backgroundColor: 'white', 
                borderRadius: 10,
                borderWidth: 2,
                borderColor: 'black',
              }}>
              {
                physicalBook ? (
                  <>
                    <Text>Enter your shipping details:</Text>
                    <TextInput
                      placeholder="Street address"
                      onChangeText={(text) => setStreetAddress(text)}
                      style={styles.inputField}
                    />
                    <TextInput
                      placeholder="City"
                      onChangeText={(text) => setCity(text)}
                      style={styles.inputField}
                    />
                    <TextInput
                      placeholder="State"
                      onChangeText={(text) => setState(text)}
                      style={styles.inputField}
                    />
                    <TextInput
                      placeholder="Zip code"
                      onChangeText={(text) => setZipCode(text)}
                      style={styles.inputField}
                    />
                  </>
                ) : null
              }
              <Text>Enter your card details:</Text>
              <CardField
                postalCodeEnabled={true}
                onCardChange={cardDetails => setCardDetails(cardDetails)}
                style={styles.cardField}
              />

              <TouchableOpacity style={styles.button} onPress={handlePay}>
                <Text style={styles.textStyle}>Pay ${totalAmount/100}.00 with Credit Card</Text>
              </TouchableOpacity>
                <View>
                  {isApplePaySupported && (
                    <PlatformPayButton
                      onPress={handlePay}
                      type={PlatformPay.ButtonType.Order}
                      appearance={PlatformPay.ButtonStyle.Black}
                      borderRadius={4}
                      style={{
                        width: '100%',
                        height: 50,
                      }}
                    />
                  )}
                </View>
              <TouchableOpacity style={styles.button} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </StripeProvider>
    </View>
  );
}





const { makeRedirectUri } = AuthSession;

 WebBrowser.maybeCompleteAuthSession();

export default function App() {

  const [message, setMessage] = useState('');
  const [parsedData, setParsedData] = useState([]);
        const [userID, setUserID] = useState(null);
        const [isModalVisible, setIsModalVisible] = useState(false);
        const [notes, setNotes] = useState("");
        const [submitted, setSubmitted] = useState("");

        const [pictureSubmitted, setPictureSubmitted ] = useState(false);
        const [isTableModalVisible, setIsTableModalVisible] = useState(false);
        const [gifterEmail, setGifterEmail] = useState("");
        const [gifterFullName, setGifterFullName] = useState("");
        const [hasPaid, setHasPaid] = useState(false);
        const [ city, setCity ] = useState('');
        const [ streetAddress, setStreetAddress ]= useState('');
        const [ zipCode, setZipCode ] = useState('');
        const [ state, setState ] = useState('')



        const [emailBody, setEmailBody] = useState('');
        const [emailSubject, setEmailSubject] = useState("Contribute please - 3 days left!");
        const [emailRecipients, setEmailRecipients] = useState([]);
        const [values, setValues] = useState([]);
  
        const [ submission, setSubmission ] = useState("");

        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [layout, setLayout] = useState('');
        const [msg, setMsg] = useState('');

        const [physicalBook, setPhysicalBook] = useState(false);
        const [includeAudio, setIncludeAudio] = useState(false);

        const [dataSource, setDataSource] = useState([]);

        const [longMessage, setLongMessage] = useState('');
        const [modalIsOpen, setModalIsOpen] = useState(false);
        const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
        const [contributors, setContributors] = useState([]);



        const [userData, setUserData] = useState(null);
        const [recipientFullName, setRecipientFullName] = useState("");
        const [recipientFirstName, setRecipientFirstName] = useState("");
        const [recipientlastName, setRecipientLastName] = useState("");
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [googleContacts, setGoogleContacts] = useState([]);
        const [ text, setText] = useState("Join us in creating a 'Bundl' of loving letters & pics for Dan G. It's a quick, fun way to share our support and appreciation. Look out for an email from dan@givebundl.com with instructions. Don't miss out!");
        const [updateLocalStorageFunction, setUpdateLocalStorageFunction] = useState(() => () => {});

        const [modalVisible, setModalVisible] = useState(false);
        const [searchTermMobile, setSearchTermMobile] = useState('');
        const [searchTerm, setSearchTerm] = useState('');
        const [contactsMobile, setContactsMobile] = useState([]);
        const [selectedContactsMobile, setSelectedContactsMobile] = useState([]);
          const [selectedContacts, setSelectedContacts] = useState([]);
        const [tableData, setTableData] = useState([]);
        const [contactCount, setContactCount] = useState([]);
        const [isContributorsModalVisible, setIsContributorsModalVisible] = useState(false);
        const [totalAmount, setTotalAmount] = useState(0);
        const [deliveryDate, setDeliveryDate ] = useState(null);
       const [recipientEmail, setRecipientEmail ] = useState('')

        const [userInfo, setUserInfo] = useState(null);
        const [token, setToken] = useState("");
        const [request, response, promptAsync] = Google.useAuthRequest({
          androidClientId: "764289968872-54s7r83tcdah8apinurbj1afh3l0f92u.apps.googleusercontent.com",
          iosClientId: "764289968872-8spc0amg0j9n4lqjs0rr99s75dmmkpc7.apps.googleusercontent.com",
          webClientId: "764289968872-tdema5ev8sf7djdjlp6a8is5k5mjrf5t.apps.googleusercontent.com",
          expoClientId: "764289968872-n5nrj6lbnv4vsc42mtso6u2mu1d7nsm5.apps.googleusercontent.com",
          scopes: ["https://www.googleapis.com/auth/contacts.readonly"], 
          redirectUri: makeRedirectUri({
            native: 'https://yay-api.herokuapp.com/mobile/oauth2callback',
            useProxy: true,
          }),
        });


        const [prompt1, setPrompt1] = useState('');
        const [prompt2, setPrompt2] = useState('');
        const [prompt3, setPrompt3] = useState('');
        const [date, setDate] = useState(new Date());
        const [show, setShow] = useState(false);
        const [ userId, setUserId] = useState(null)
      
        const futureDate = new Date();
        if (physicalBook) {
          futureDate.setDate(futureDate.getDate() + 14);
        } else {
          futureDate.setDate(futureDate.getDate() + 7);
        }
      const [hasUpdated, setHasUpdated] = useState(false);
      
        const onChange = (event, selectedDate) => {
          const currentDate = selectedDate || date;
          setShow(Platform.OS === 'ios');
          setDate(currentDate);
        };
      
        const placeholderName = recipientFullName || 'your recipient';


        // Get the screen's height
const screenHeight = Dimensions.get('window').height


useEffect(() => {
  async function createUserAndBook() {
    try {
      // Create a new user
      let response = await fetch('https://yay-api.herokuapp.com/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'new_user',
          name: 'New User',
        }),
      });
      let data = await response.json();

      // Save the user's ID
      const newUserId = data._id;
      console.log('userId :', data._id)
      setUserId(newUserId);

      // Create a new book for the user
      response = await fetch('https://yay-api.herokuapp.com/book/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: newUserId,
        }),
      });

      // Check if the book was created successfully
      if (!response.ok) {
        throw new Error('Failed to create book');
      }
    } catch (err) {
      console.error(err);
    }
  }

  createUserAndBook();
}, []);

useEffect(() => {
  if (userId) {
    setMessage(`Hello! I am compiling supportive notes and meaningful pictures for ${recipientFullName}. Writing and submit your letter only takes a couple minutes. Sometime before the deadline, in the next 7 days, can you use this link contribute? -->  https://www.givebundl.com/contribute/${userId} I know it would mean a lot to ${recipientFullName.split(' ')[0]}. Also, keep an eye out for reminder emails from dan@givebundl.com. Thank you! Want to make this a special gift for ${recipientFullName.split(' ')[0]}.`);
  }
}, [userId]);

useEffect(() => {
  if (recipientFullName) {
    setMessage(`Hello! I am compiling supportive notes and meaningful pictures for ${recipientFullName}. Writing and submit your letter only takes a couple minutes. Sometime before the deadline, in the next 7 days can use this link to contribute?  -->  https://www.givebundl.com/contribute/${userId}  I know it would mean a lot to ${recipientFullName.split(' ')[0]}. Also, keep an eye out for reminder emails from dan@givebundl.com Thank you! Want to make this a special gift for ${recipientFullName.split(' ')[0]}.`);
  }
}, [recipientFullName]);

    useEffect(() => {
      console.log('hasPaid:', hasPaid);
    }, [hasPaid]);

useEffect(() => {
  if (response?.type === 'success') {
    const { access_token } = response.params;

    // The access token is available in access_token
    console.log(access_token);

    // Handle the effect
    const handleEffect = async () => {
      const user = await getLocalUser();
      console.log("user", user);
      if (!user) {
        setToken(response.authentication.accessToken);
        getUserInfo(response.authentication.accessToken);
      } else {
        setUserInfo(user);
        console.log("loaded locally");
      }
    };

    // Call the handleEffect function
    handleEffect();
  }
}, [response, token]);

      
        const getLocalUser = async () => {
          const data = await AsyncStorage.getItem("@user");
          if (!data) return null;
          return JSON.parse(data);
        };
      
        const getUserInfo = async (token) => {
          if (!token) return;
          try {
            const response = await fetch(
              "https://www.googleapis.com/userinfo/v2/me",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
      
            const user = await response.json();
            await AsyncStorage.setItem("@user", JSON.stringify(user));
            setUserInfo(user);
          } catch (error) {
            // Add your own error handler here
          }
        };


          const getContacts = async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
              const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
              });
              if (data.length > 0) {
                setContactsMobile(data);
                setModalVisible(true);
              }
            }
          };
          
          const addContactToList = async (contact, index) => {
            const newContact = {
              id: tableData.length + index + 1, // This will increment the ID for each new contact
              name: contact.names[0].displayName,
              emailAddresses: [{ value: prioritizeEmail(contact.emailAddresses) }], // Use the prioritizeEmail function here
              phoneNumber: '', // Changed "address" to "sms"
            };
          
            // Check if a contact with the same name already exists in the tableData
            if (tableData.some(existingContact => existingContact.name === newContact.name)) {
              console.log(`A contact with the name ${newContact.name} already exists.`);
              return;
            }
          
            // Add the new contact to the tableData state
            setTableData(prevTableData => [...prevTableData, newContact]);
          
            // Increment the contact count
            setContactCount(prevCount => prevCount + 1);
          };
          

      const prioritizeEmail = (emailAddresses) => {
        if (!emailAddresses || emailAddresses.length === 0) return '';
        const sortedEmails = emailAddresses.sort((a, b) => {
          if (a.value.endsWith('.com') && b.value.endsWith('.edu')) return -1;
          if (a.value.endsWith('.edu') && b.value.endsWith('.com')) return 1;
          return 0;
        });
        return sortedEmails[0].value;
      };


      const filteredContactsGoogle = googleContacts.filter(contact => {
        const hasEmail = contact.emailAddresses && contact.emailAddresses.length > 0;
        const matchesSearchTerm = contact.names && contact.names.some(name => name.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
        return hasEmail && matchesSearchTerm;
      });

    const handleSearch = (text) => {
      setSearchTerm(text);
    };

      useEffect(() => {
        // Define a function that updates localStorage
        const updateLocalStorage = (data) => {
          if (typeof window !== 'undefined') {
            AsyncStorage.setItem('csvData', JSON.stringify(data));
          }
        };

        // Set the function in state so it can be used outside of this effect
        setUpdateLocalStorageFunction(() => updateLocalStorage);
      }, []);



      // In your component's useEffect hook
      useEffect(() => {
      const isAuthenticating =  AsyncStorage.getItem('isAuthenticating');
      if (isAuthenticating === 'true') {
        setIsAuthenticated(true);
        AsyncStorage.removeItem('isAuthenticating'); // Remove the flag from local storage once it has been checked
      }
      }, []);

  

      const handleContactSelect = (contact, isSelected) => {
      setSelectedContacts(prevSelectedContacts => {
        if (isSelected) {
          return [...prevSelectedContacts, contact];
        } else {
          return prevSelectedContacts.filter(c => c.resourceName !== contact.resourceName);
        }
      });
      };
    const addSelectedContactsToList = async () => {
        for (let i = 0; i < selectedContacts.length; i++) {
          await addContactToList(selectedContacts[i], i);
        }
        setSelectedContacts([]);
        setIsModalOpen(false);
      };


      async function fetchGoogleContacts(token) {
        try {
          if (!userInfo) {
            console.error('User info not found');
            return;
          }
      
          const tokens = token;
          console.log('tokens = '+ tokens);
          const response = await fetch('https://yay-api.herokuapp.com/mobile/getPeople', {
            headers: {
              'Authorization': `Bearer ${tokens}`,
            },
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
      
          const contacts = await response.json();
          setGoogleContacts(contacts);
          console.log('Google Contacts:', contacts); // Log the contacts
          setIsModalOpen(true); // Open the modal once the contacts are fetched
        } catch (error) {
          console.error('Failed to fetch Google contacts:', error);
        }
      }
      

        
     
        const handleSelectContact = (contact, phoneNumber) => {  // Added phoneNumber as a parameter
          const contactWithPhoneNumber = { ...contact, phoneNumber };
        
          if (selectedContactsMobile.some((selectedContact) => selectedContact.id === contact.id && selectedContact.phoneNumber === phoneNumber)) {
            setSelectedContactsMobile((prev) => prev.filter((selectedContact) => selectedContact.id !== contact.id || selectedContact.phoneNumber !== phoneNumber));
          } else {
            setSelectedContactsMobile((prev) => [...prev, contactWithPhoneNumber]);
          }
        };
        
        
        const handleAddToList = () => { // phone contacts
          setTableData(prev => [...prev, ...selectedContactsMobile]);
          setSelectedContactsMobile([]);
          setModalVisible(false);
        };
        // const handleDeleteContact = (contactToDelete) => {
        //   setTableData((prevTableData) => {
        //     return prevTableData.filter(contact => contact.id !== contactToDelete.id);
        //   });
        // };
        
       
      const filteredContacts = contactsMobile.filter((contact) =>
      (contact.name && (contact.phoneNumbers && contact.phoneNumbers.length > 0 || contact.emails && contact.emails.length > 0)) && contact.name.toLowerCase().includes(searchTermMobile.toLowerCase())
    );

  
        
        const handleEmail = () => {
          submitAndSendWelcomeMessageEmail(tableData);
    
        }
        
        const handleSMS = () => {
          submitAndSendWelcomeMessageSMS(tableData);
    
        }

        const handleOk = async () => {
          setIsModalVisible(false);
        
          const newStudent = {
            id: dataSource.length + 1,
            name: name,
            email: email,
            submitted: submitted,
            submission: submission,
            picture: pictureSubmitted, // starts as an empty string
            notes: notes,
          };
        
          // Add the new student to the dataSource state
          setDataSource([...dataSource, newStudent]);
        
        }
        
        const prioritizeEmailGoogle = (emailAddresses) => {
          if (!emailAddresses || emailAddresses.length === 0) {
            return 'No email';
          }

          const priorityDomains = ['@outlook.com', '@gmail.com', '@hotmail.com'];
          
          // Sort email addresses based on the priority of the domain
          const sortedEmailAddresses = emailAddresses.sort((a, b) => {
            const aDomain = a.value.split('@')[1];
            const bDomain = b.value.split('@')[1];
            const aPriority = priorityDomains.includes(aDomain) ? 1 : 0;
            const bPriority = priorityDomains.includes(bDomain) ? 1 : 0;
            return bPriority - aPriority;
          });

          // Return the first email address in the sorted list
          return sortedEmailAddresses[0].value;
        };


        const handleCancel = () => {
          setIsModalVisible(false);
        };
        async function submitAndSendWelcomeMessageEmail(contributors) {
          // Calculate the total amount to charge
          let totalAmount = 0;
          if (physicalBook) {
            totalAmount += 17900; // $179 in cents
          }
          if (includeAudio) {
            totalAmount += 1000; // $10 in cents
          }
          
          // If there's a charge, check if the user has paid
          if (totalAmount > 0) {
            if (hasPaid) {
              // If the user has paid, send the welcome email directly
              return sendWelcomeEmail(contributors);
            } else {
              // If the user hasn't paid, open the payment modal
              setTotalAmount(totalAmount);
              setIsPaymentModalVisible(true);
            }
          } else {
            // If there's no charge, send the welcome email directly
            return sendWelcomeEmail(contributors);
          }
        }
        
        async function submitAndSendWelcomeMessageSMS(contributors) {
          // Calculate the total amount to charge
          let totalAmount = 0;
          if (physicalBook) {
            totalAmount += 17900; // $179 in cents
          }
          if (includeAudio) {
            totalAmount += 1000; // $10 in cents
          }
          
          // If there's a charge, check if the user has paid
          if (totalAmount > 0) {
            if (hasPaid) {
              // If the user has paid, send the welcome SMS directly
              return sendWelcomeSMS(contributors);
            } else {
              // If the user hasn't paid, open the payment modal
              setTotalAmount(totalAmount);
              setIsPaymentModalVisible(true);
            }
          } else {
            // If there's no charge, send the welcome SMS directly
            return sendWelcomeSMS(contributors);
          }
        }
        async function sendWelcomeEmail(contributors) {
          // Prepare a group email for all contributors with an email address
          const emails = contributors.flatMap(contributor => contributor.emailAddresses || []).map(emailObj => emailObj.value);
          
          if (emails.length > 0) {
            const mailOptions = {
              recipients: emails,
              subject: 'Gift for ' + recipientFullName,
              body: message,
            };
            const isAvailable = await MailComposer.isAvailableAsync();
            
            if (isAvailable) {
              try {
                await MailComposer.composeAsync(mailOptions);
          
                if (!hasUpdated) {
                  // Call the API to update the book
                  const bookResponse = await fetch(`https://yay-api.herokuapp.com/book/${userId}/firstUpdate`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      rec_name: recipientFullName,
                      rec_first_name: recipientFullName.split(' ')[0],
                      introNote: message,
                      contributors: contributors,
                      deliveryDate: deliveryDate,
                      physicalBook: physicalBook
                    }),
                  });
                  
                  // Set hasUpdated to true after making the API call
                  setHasUpdated(true);
                }
                
                // Call the API to update the user
                const userResponse = await fetch(`https://yay-api.herokuapp.com/users/${userId}/updateUser`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: gifterFullName,
                    rec_name: recipientFullName,
                    rec_first_name: recipientFullName.split(' ')[0],
                    prompts: [prompt1, prompt2, prompt3],
                    introNote: message,
                    giftOwnerEmail: gifterEmail // replace 'userEmail' with the actual variable for the user's email
                  }),
                });
        
                return true;
              } catch (err) {
                console.error('Failed to send email:', err);
                return false;
              }
            } else {
              console.error('Mail is not available');
              return false;
            }
          }
          return false;
        }
        
        async function sendWelcomeSMS(contributors) {
          // Prepare a group SMS for all contributors with a phone number
          const phones = contributors
            .map(contributor => contributor.phoneNumber.replace(/\D/g, ''))  // remove non-digit characters
            .filter(phone => phone);
          
          if (phones.length > 0) {
            const isAvailable = await SMS.isAvailableAsync();
            
            if (isAvailable) {
              try {
                await MailComposer.composeAsync(mailOptions);
          
                if (!hasUpdated) {
                  // Call the API to update the book
                  const bookResponse = await fetch(`https://yay-api.herokuapp.com/book/${userId}/firstUpdate`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      rec_name: recipientFullName,
                      rec_first_name: recipientFullName.split(' ')[0],
                      introNote: message,
                      contributors: contributors,
                      deliveryDate: deliveryDate,
                      physicalBook: physicalBook
                    }),
                  });
                  
                  // Set hasUpdated to true after making the API call
                  setHasUpdated(true);
                }
                
                
                // Call the API to update the user
                const userResponse = await fetch(`https://yay-api.herokuapp.com/users/${userId}/updateUser`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: gifterFullName,
                    rec_name: recipientFullName,
                    rec_first_name: recipientFullName.split(' ')[0],
                    prompts: [prompt1, prompt2, prompt3],
                    introNote: message,
                    giftOwnerEmail: gifterEmail // replace 'userEmail' with the actual variable for the user's email
                  }),
                });
                
                return true;
              } catch (err) {
                console.error('Failed to send SMS:', err);
                return false;
              }
            } else {
              console.error('SMS is not available');
              return false;
            }
          }
          return false;
        }
        
        


          const handleDelete = (index) => {
            const newData = [...tableData];
            newData.splice(index, 1);
            setTableData(newData);
          };
        
       const handleCheckOut = () => {
        // Calculate the total amount to charge
        let totalAmount = 0;
        if (physicalBook) {
          totalAmount += 17900; // $99 in cents
        }
        if (includeAudio) {
          totalAmount += 1000; // $15 in cents

        }

        // If there's a charge, open the payment modal
        if (totalAmount > 0) {
          setTotalAmount(totalAmount);
          setIsPaymentModalVisible(true);
        } else {
          // If there's no charge, prompt the send message buttons to appear
          setHasPaid(true);  

        }
      }
      
      const hasEmails = tableData.some(item => item.emailAddresses && item.emailAddresses.length > 0);
      const hasPhoneNumbers = tableData.some(item => item.phoneNumber);
      

  return (
    <View style={{ padding: 40, marginTop: 32 }}>

      {/* Modals */}

      {
        (physicalBook || includeAudio) ? (
          <PaymentModal
            isModalVisible={isPaymentModalVisible}
            setIsModalVisible={setIsPaymentModalVisible}
            totalAmount={totalAmount}
            gifterEmail={gifterEmail}
            sendWelcomeEmail={sendWelcomeEmail}
            sendWelcomeSMS={sendWelcomeSMS}
            selectedContributorsMobile={selectedContactsMobile}
            selectedContributors={selectedContacts}
            hasPaid={hasPaid}
            setHasPaid={setHasPaid}
            setCity={setCity}
            setStreetAddress={setStreetAddress}
            setZipCode={setZipCode}
            setState={setState}
            physicalBook={physicalBook}
            />
        ) : null
      }


    <Modal visible={isModalVisible} transparent={true}>
        <View style={{ margin: 50, backgroundColor: 'gray', borderRadius: 10, padding: 10, alignItems: 'center', justifyContent: 'center',}}>
            <Text>Add a new contributor manually</Text>
            <Text>Name</Text>
            <TextInput placeholder="Name" value={name} onChangeText={(text) => setName(text)} />
            <Text>Email</Text>
            <TextInput placeholder="Email" value={email} onChangeText={(text) => setEmail(text)} />
            <Text>Submitted</Text>
            <Picker selectedValue={submitted} onValueChange={(itemValue) => setSubmitted(itemValue)}>
                <Picker.Item label="Yes" value="yes" />
                <Picker.Item label="No" value="no" />
            </Picker>
            <Text>Submission</Text>
            <TextInput multiline={true} numberOfLines={10} maxLength={650} placeholder="Submission" value={submission} onChangeText={(text) => setSubmission(text)} />
            <Text>Picture Upload</Text>
            <Text>Notes</Text>
            <TextInput placeholder="Notes" value={notes} onChangeText={(text) => setNotes(text)} />
            <TouchableOpacity style={styles.button} onPress={handleOk}>
                <Text>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleCancel}>
                <Text>Cancel</Text>
            </TouchableOpacity>
        </View>
      
    </Modal>
    <Modal visible={isContributorsModalVisible} transparent={true}>
          <View style={{ 
            margin: 50, 
            height: screenHeight - 100,  // subtract the total margin from the screen height
            backgroundColor: 'gray', 
            borderRadius: 10, 
            padding: 10, 
            justifyContent: 'space-between'
          }}>
            <Text style={{ color: 'white', fontSize: 20 }}>Your Contributors ({tableData.length})</Text>
            <FlatList
              data={tableData}
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
                  <View style={{ flexGrow: 1 }}>
                    <Text style={{ color: 'white', fontSize: 12 }}>{item.name ? item.name : ''}</Text>
                    <Text style={{ color: 'white', fontSize: 10 }}>{prioritizeEmail(item.emailAddresses)}</Text>
                    <Text style={{ color: 'white', fontSize: 10 }}>{item.phoneNumber ? item.phoneNumber : ''}</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
                    <Text style={styles.deleteButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            <TouchableOpacity style={styles.button} onPress={() => setIsContributorsModalVisible(false)} >
              <Text style={styles.buttonText}>Close</Text> 
            </TouchableOpacity>
          </View>
        </Modal>


          <Modal visible={modalVisible} transparent={true}>
                  <View style={{ 
                        margin: 50, 
                        height: screenHeight - 100,  // subtract the total margin from the screen height
                        backgroundColor: 'gray', 
                        borderRadius: 10, 
                        padding: 10, 
                        justifyContent: 'space-between'
                  }}>
                    <Text style={{ color: 'white', fontSize: 20  }}>Mobile Contact List:</Text>
                    <TextInput
                        style={{ height: 40, borderColor: 'black', borderWidth: 2, color: 'white' }}
                        onChangeText={setSearchTermMobile}
                        value={searchTermMobile}
                        placeholder="Search contacts"
                        placeholderTextColor="white"
                    />
                    <FlatList
                      data={filteredContacts}
                      contentContainerStyle={{ padding: 2 }}
                      keyExtractor={(item, index) => item.id + index}  // Modified keyExtractor
                      renderItem={({ item }) => (
                        // Map over phoneNumbers array
                        item.phoneNumbers && item.phoneNumbers.map((phoneNumber, index) => (
                          <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Switch
                            value={selectedContactsMobile.some((selectedContact) => selectedContact.id === item.id && selectedContact.phoneNumber === phoneNumber.number)}
                            onValueChange={() => handleSelectContact(item, phoneNumber.number)}  
                            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }} 
                          />

                            <Text style={{ color: 'white', fontSize: 10 }}>
                              {item.name} ({phoneNumber.label || 'Unknown'}) {phoneNumber.number || 'No phone number'}
                            </Text>
                          </View>
                        ))
                      )}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleAddToList} color="white" >
                        <Text style={styles.buttonText}>Add phone numbers to list</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)} color="white">
                        <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity> 
                </View>
            </Modal>

            <Modal visible={isModalOpen} transparent={true}>
              <View style={{ 
                margin: 50, 
                height: screenHeight - 100,  // subtract the total margin from the screen height
                backgroundColor: 'gray', 
                borderRadius: 10, 
                padding: 10, 
                justifyContent: 'space-between'
              }}>             
                <Text style={{ color: 'white', fontSize: 20 }}>Google Contact List:</Text>
                <TextInput
                  style={{ height: 40, borderColor: 'black', borderWidth: 2, color: 'white' }}
                  onChangeText={handleSearch}
                  placeholder="Search contacts"
                  placeholderTextColor="white"
                />
                <ScrollView>
                  {filteredContactsGoogle.map(contact => {
                    // Check if the contact has an email
                    const email = prioritizeEmailGoogle(contact.emailAddresses);
                    if (email == "No email") {
                      // If the contact doesn't have an email, don't render anything
                      return null;
                    }

                    // If the contact has an email, render the contact
                    return (
                      <View key={contact.resourceName} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Switch
                          value={selectedContacts.includes(contact)}
                          onValueChange={isChecked => handleContactSelect(contact, isChecked)}
                          style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }} 
                        />
                        <Text style={{ color: 'white', fontSize: 9 }}>
                          {contact.names && contact.names.length > 0 ? contact.names[0].displayName : 'Unnamed Contact'} | {email}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={styles.button} onPress={addSelectedContactsToList} >
                  <Text style={styles.buttonText}>Add Emails to list</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setIsModalOpen(false)} >
                  <Text style={styles.buttonText}>Close</Text> 
                </TouchableOpacity>
              </View>
            </Modal>

    <ScrollView style={styles.container}>
              <View style={styles.container} contentContainerStyle={{ alignItems: 'center' }} >
              <View style={styles.section}>
                  <Text style={styles.title}>Your Bundl Gift</Text>
                  <Text style={styles.subtitle}>Write out the recipient of the gift, the people who will contribute to the email series, and the initial message you will send to the contributors.</Text>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Your full name</Text>
                      <TextInput
                          style={styles.input}
                          value={gifterFullName}
                          onChangeText={setGifterFullName}
                          placeholder="Your full name"
                      />
                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Your email address</Text>
                      <TextInput
                          style={styles.input}
                          value={gifterEmail}
                          type="email"
                          onChangeText={setGifterEmail}
                          placeholder="Your email address"
                      />
                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Recipient's full name</Text>
                      <TextInput
                          style={styles.input}
                          value={recipientFullName}
                          onChangeText={setRecipientFullName}
                          placeholder="Your recipient's full name"
                      />
                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Recipient's email address</Text>
                      <TextInput
                          style={styles.input}
                          value={recipientEmail}
                          onChangeText={setRecipientEmail}
                          placeholder="Your recipient's email address"
                      />
                  </View>
                  <View style={styles.inputContainer}>

                  <View style={styles.buttonContainer}>
        
                      <TouchableOpacity style={styles.button} onPress={() => setShow(true)}> 
                      <Text style={styles.buttonText}>Delivery Date of First Daily Email</Text>
                      </TouchableOpacity>
    
                      {show && (
                        <DateTimePicker
                          testID="dateTimePicker"
                          value={date}
                          mode={'date'}
                          is24Hour={true}
                          display="default"
                          onChange={onChange}
                          minimumDate={futureDate}
                        />
                      )}
                    </View>
              </View>

                  <View style={styles.inputContainer}>

                  <Text style={styles.label}>Prompts for your contributors to write from</Text>
                  <View style={styles.inputContainer}>
                      <TextInput
                          style={styles.input}
                          value={prompt1}
                          onChangeText={setPrompt1}
                          placeholder={`1. What is your favorite thing about ${placeholderName}?`}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <TextInput
                          style={styles.input}
                          value={prompt2}
                          onChangeText={setPrompt2}
                          placeholder={`2. What positive thing have you learned from ${placeholderName}?`}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <TextInput
                          style={styles.input}
                          value={prompt3}
                          onChangeText={setPrompt3}
                          placeholder={`3. What is your favorite memory with ${placeholderName}?`}
                      />
                  </View>
                </View>

                  <View style={styles.buttonContainer}>

                    <Text>Choose you Bundl contributors from your existing contacts.</Text>
                    <TouchableOpacity style={styles.button} onPress={getContacts}>
                          <Text style={styles.buttonText}>Select from Phone Contacts</Text>
                      </TouchableOpacity> 
                   
                    </View>


                  <View style={styles.buttonContainer} >

                  <View style={styles.container}>
                          {!userInfo ? (
                              <TouchableOpacity
                                  style={styles.button}
                                  disabled={!request}
                                  onPress={() => {
                                      promptAsync();
                                  }}
                              >
                                  <Text style={styles.text}>Select from Google Contacts</Text>
                              </TouchableOpacity>
                          ) : (
                              <View>
                                  <TouchableOpacity
                                      style={styles.button}
                                      onPress={() => fetchGoogleContacts(response.params.access_token)}
                                  >
                                      <Text style={styles.buttonText}>View Google Contacts</Text>
                                  </TouchableOpacity>
                              </View>
                          )}
                      </View>

                  <TouchableOpacity  style={styles.button} onPress={() => setIsContributorsModalVisible(true)}>
                      <Text style={styles.buttonText} >View Selected Contacts ({tableData.length})</Text>
                    </TouchableOpacity>
                     

                     

                  </View>
                  <View style={styles.inputContainer}>
                      <Text style={styles.label}>Welcome message to contributors</Text>
                      <ScrollView>
                      <TextInput
                          style={styles.textarea}
                          value={message}
                          onChangeText={setMessage}
                          multiline
                          numberOfLines={3}
                      />
                      </ScrollView>
                  </View>

                  <View style={styles.buttonContainer}>

        <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <Switch
                value={includeAudio}
                onValueChange={setIncludeAudio}
            />
            <Text>Yes, I want to pay $10 to allow my selected contacts to record audio in addition to writing text and submitting a picture.</Text>
        </View>

        <View style={{flexDirection: 'column', alignItems: 'center'}}>
            <Switch
                value={physicalBook}
                onValueChange={setPhysicalBook}
            />
            <Text>Yes, I want to pay $179 make the email series into a physical gift book at the end.</Text>
                  </View>


   {(hasPaid || (!physicalBook && !includeAudio)) && (
              <>
                  { hasEmails && ( 
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity 
                          style={styles.button} 
                          onPress={handleEmail}
                      >
                          <Text style={styles.buttonText}>
                              Email welcome message to selected contributors
                          </Text>
                      </TouchableOpacity>
                      </View>
                  )}
       
                  { hasPhoneNumbers && ( 
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity 
                          style={styles.button} 
                          onPress={handleSMS}
                      >
                          <Text style={styles.buttonText}>
                              Text welcome message to selected contributors
                          </Text>
                      </TouchableOpacity>
                  </View>
                  )}
              </>
          )} 

          {(!hasPaid && (physicalBook || includeAudio)) && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleCheckOut}
              >
                  <Text style={styles.buttonText}>
                      Check out
                  </Text>
              </TouchableOpacity>
            </View>
          )}

          </View>
              </View>
              </View >
      </ScrollView>
    
  </View>


  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  cardField: {
    height: 50,
    marginTop: 30,
    width: '100%',
  },
  textStyle: {
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    border: '3px solid black',
  },
  cardText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20, // consistent margin for all sections
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
  },
  inputContainer: {
    marginTop: 10, // consistent margin for all input containers
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  textarea: {
    height: 80,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  buttonContainer: {
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
    flexDirection: 'column', // stack buttons vertically
  },
  button: {
    backgroundColor: '#FF7F7F', // light red
    paddingHorizontal: 10,
    justifyContent: 'center', // align text vertically in the center
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 5,
    width: 200
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  itemContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'transparent', 
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    },
    deleteButton: {
      backgroundColor: 'red', // Choose the color you prefer
      width: 20, // Adjust the width and height to modify the size of the square
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5,
      marginLeft: 10, // Add some margin if you want some space between the text and the button
    },
    deleteButtonText: {
      color: 'white', // Choose the color you prefer
      fontSize: 16, // Adjust the font size to make the "X" smaller or larger
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});