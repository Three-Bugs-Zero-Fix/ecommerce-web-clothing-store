/* ============================================================
   js/profile.js
   BlueWear User Profile Management

   Depends on:
   - js/firebase.js
   - js/auth.js
============================================================ */


/* ============================================================
   CONFIG
============================================================ */

// ImgBB API key
//const IMGBB_API_KEY = "50e321961cde194d90cbf941cd472015";


/* ============================================================
   ELEMENTS
============================================================ */

const profileName =
    document.getElementById("profile-name");

const profileEmail =
    document.getElementById("profile-email");

const profileEmailInput =
    document.getElementById("profile-email-input");

const profilePhone =
    document.getElementById("profile-phone");

const profileAddress =
    document.getElementById("profile-address");

const profileCity =
    document.getElementById("profile-city");

const profilePostal =
    document.getElementById("profile-postal");

const profileDistrict =
    document.getElementById("profile-district");

const profileCountry =
    document.getElementById("profile-country");

const profileDisplayName =
    document.getElementById("profile-display-name");

const profilePhoto =
    document.getElementById("profile-photo");

const profilePhotoPlaceholder =
    document.getElementById("profile-photo-placeholder");

const profilePhotoInput =
    document.getElementById("profile-photo-input");

const changePhotoButton =
    document.getElementById("change-photo-btn");

const saveButton =
    document.getElementById("save-profile-btn");

const saveMessage =
    document.getElementById("profile-save-message");

const memberSince =
    document.getElementById("profile-member-since");


/* ============================================================
   STATE
============================================================ */

let currentUser = null;
let profilePhotoUrl = "";


/* ============================================================
   AUTH + LOAD PROFILE
============================================================ */

requireAuth("login.html")
    .then(async (user) => {

        currentUser = user;

        // Firebase Auth email
        if (profileEmail) {
            profileEmail.textContent =
                user.email || "No email";
        }

        if (profileEmailInput) {
            profileEmailInput.value =
                user.email || "";
        }

        // Firebase Auth display name
        if (profileDisplayName) {
            profileDisplayName.textContent =
                user.displayName || "Your Name";
        }

        // Member since
        if (memberSince && user.metadata?.creationTime) {

            const date =
                new Date(user.metadata.creationTime);

            memberSince.textContent =
                date.toLocaleDateString("en-BD", {
                    month: "short",
                    year: "numeric"
                });
        }

        await loadProfile(user);

    })
    .catch((error) => {

        console.error(
            "Profile authentication error:",
            error
        );

    });


/* ============================================================
   LOAD PROFILE
============================================================ */

async function loadProfile(user) {

    try {

        const profileDoc =
            await db
                .collection("users")
                .doc(user.uid)
                .get();


        /*
         * No Firestore profile yet.
         * Use Firebase Auth information.
         */

        if (!profileDoc.exists) {

            if (profileName) {
                profileName.value =
                    user.displayName || "";
            }

            if (profileDisplayName) {
                profileDisplayName.textContent =
                    user.displayName || "Your Name";
            }

            return;
        }


        const data =
            profileDoc.data();


        /* ---------- PERSONAL ---------- */

        if (profileName) {
            profileName.value =
                data.name ||
                user.displayName ||
                "";
        }

        if (profileDisplayName) {
            profileDisplayName.textContent =
                data.name ||
                user.displayName ||
                "Your Name";
        }

        if (profilePhone) {
            profilePhone.value =
                data.phone || "";
        }


        /* ---------- ADDRESS ---------- */

        if (profileAddress) {
            profileAddress.value =
                data.address || "";
        }

        if (profileCity) {
            profileCity.value =
                data.city || "";
        }

        if (profilePostal) {
            profilePostal.value =
                data.postalCode || "";
        }

        if (profileDistrict) {
            profileDistrict.value =
                data.district || "";
        }

        if (profileCountry) {
            profileCountry.value =
                data.country || "Bangladesh";
        }


        /* ---------- PHOTO ---------- */

        profilePhotoUrl =
            data.photoUrl || "";

        updatePhotoPreview(
            profilePhotoUrl
        );

    } catch (error) {

        console.error(
            "Failed to load profile:",
            error
        );

        showMessage(
            "Unable to load your profile. Please refresh and try again.",
            true
        );
    }
}


/* ============================================================
   CHANGE PHOTO BUTTON
============================================================ */

if (changePhotoButton) {

    changePhotoButton.addEventListener(
        "click",
        () => {

            if (profilePhotoInput) {
                profilePhotoInput.click();
            }

        }
    );
}


/* ============================================================
   PHOTO INPUT
============================================================ */

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        async (event) => {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            clearMessage();


            /* ---------- FILE TYPE ---------- */

            if (!file.type.startsWith("image/")) {

                showMessage(
                    "Please select a valid image.",
                    true
                );

                profilePhotoInput.value = "";

                return;
            }


            /* ---------- FILE SIZE ---------- */

            if (file.size > 5 * 1024 * 1024) {

                showMessage(
                    "Profile image must be smaller than 5 MB.",
                    true
                );

                profilePhotoInput.value = "";

                return;
            }


            try {

                setPhotoLoading(true);


                /*
                 * Resize image before uploading.
                 */

                const jpegFile =
                    await resizeAndConvertToJPEG(file);


                /*
                 * Upload to ImgBB.
                 */

                const uploadedUrl =
                    await uploadToImgBB(jpegFile);


                profilePhotoUrl =
                    uploadedUrl;


                updatePhotoPreview(
                    profilePhotoUrl
                );


                showMessage(
                    "Photo uploaded. Click Save Changes to keep it.",
                    false
                );

            } catch (error) {

                console.error(
                    "Profile photo upload failed:",
                    error
                );

                showMessage(
                    "Profile photo upload failed. Please try again.",
                    true
                );

            } finally {

                setPhotoLoading(false);

            }
        }
    );
}


/* ============================================================
   PHOTO PREVIEW
============================================================ */

function updatePhotoPreview(url) {

    if (!profilePhoto ||
        !profilePhotoPlaceholder) {

        return;
    }


    if (url) {

        profilePhoto.src =
            url;

        profilePhoto.style.display =
            "block";

        profilePhotoPlaceholder.style.display =
            "none";

    } else {

        profilePhoto.src =
            "";

        profilePhoto.style.display =
            "none";

        profilePhotoPlaceholder.style.display =
            "flex";
    }
}


/* ============================================================
   PHOTO LOADING
============================================================ */

function setPhotoLoading(loading) {

    if (!changePhotoButton) {
        return;
    }


    changePhotoButton.disabled =
        loading;


    changePhotoButton.style.opacity =
        loading ? "0.6" : "1";


    changePhotoButton.style.cursor =
        loading ? "wait" : "pointer";
}


/* ============================================================
   SAVE PROFILE
============================================================ */

if (saveButton) {

    saveButton.addEventListener(
        "click",
        async () => {

            clearMessage();


            if (!currentUser) {

                showMessage(
                    "You are not signed in.",
                    true
                );

                return;
            }


            /* ---------- GET VALUES ---------- */

            const name =
                profileName
                    ? profileName.value.trim()
                    : "";

            const phone =
                profilePhone
                    ? profilePhone.value.trim()
                    : "";

            const address =
                profileAddress
                    ? profileAddress.value.trim()
                    : "";

            const city =
                profileCity
                    ? profileCity.value.trim()
                    : "";

            const postalCode =
                profilePostal
                    ? profilePostal.value.trim()
                    : "";

            const district =
                profileDistrict
                    ? profileDistrict.value.trim()
                    : "";

            const country =
                profileCountry
                    ? profileCountry.value.trim()
                    : "Bangladesh";


            /* ---------- VALIDATION ---------- */

            if (!name) {

                showMessage(
                    "Please enter your name.",
                    true
                );

                profileName.focus();

                return;
            }


            if (
                phone &&
                !isValidPhone(phone)
            ) {

                showMessage(
                    "Please enter a valid mobile number.",
                    true
                );

                profilePhone.focus();

                return;
            }


            /* ---------- SAVE LOADING ---------- */

            setSaveLoading(true);


            try {

                /*
                 * Update Firebase Authentication
                 * display name.
                 */

                await updateDisplayName(name);


                /*
                 * Save profile to Firestore.
                 *
                 * users/{uid}
                 */

                await db
                    .collection("users")
                    .doc(currentUser.uid)
                    .set(
                        {
                            name: name,

                            email:
                                currentUser.email || "",

                            phone: phone,

                            address: address,

                            city: city,

                            postalCode: postalCode,

                            district: district,

                            country: country,

                            photoUrl:
                                profilePhotoUrl,

                            updatedAt:
                                firebase.firestore
                                    .FieldValue
                                    .serverTimestamp()
                        },
                        {
                            merge: true
                        }
                    );


                /*
                 * Update UI immediately.
                 */

                if (profileDisplayName) {

                    profileDisplayName.textContent =
                        name;
                }


                /*
                 * Update navbar/avatar if the
                 * auth/profile drawer code uses it.
                 */

                if (
                    typeof updateProfileButton ===
                    "function"
                ) {
                    updateProfileButton();
                }


                showMessage(
                    "Your profile has been saved successfully.",
                    false
                );

            } catch (error) {

                console.error(
                    "Profile save failed:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to save your profile.",
                    true
                );

            } finally {

                setSaveLoading(false);

            }
        }
    );
}


/* ============================================================
   PHONE VALIDATION
============================================================ */

function isValidPhone(phone) {

    const cleaned =
        phone.replace(
            /[\s-]/g,
            ""
        );


    return /^(01[3-9]\d{8}|\+8801[3-9]\d{8}|8801[3-9]\d{8})$/
        .test(cleaned);
}


/* ============================================================
   SAVE BUTTON LOADING
============================================================ */

function setSaveLoading(loading) {

    if (!saveButton) {
        return;
    }


    saveButton.disabled =
        loading;


    saveButton.style.opacity =
        loading ? "0.7" : "1";


    saveButton.style.cursor =
        loading ? "wait" : "pointer";


    /*
     * Keep the SVG inside the button.
     * Only change the text node.
     */

    if (loading) {

        saveButton.dataset.originalText =
            "Save Changes";

        saveButton.childNodes.forEach(
            (node) => {

                if (
                    node.nodeType ===
                    Node.TEXT_NODE &&
                    node.textContent.trim()
                ) {
                    node.textContent =
                        " Saving...";
                }

            }
        );

    } else {

        saveButton.childNodes.forEach(
            (node) => {

                if (
                    node.nodeType ===
                    Node.TEXT_NODE &&
                    node.textContent.trim()
                ) {
                    node.textContent =
                        " Save Changes";
                }

            }
        );
    }
}


/* ============================================================
   MESSAGES
============================================================ */

function showMessage(message, isError) {

    if (!saveMessage) {
        return;
    }


    saveMessage.textContent =
        message;


    saveMessage.style.display =
        "block";


    if (isError) {

        saveMessage.style.color =
            "#c62828";

    } else {

        saveMessage.style.color =
            "#16834d";
    }
}


function clearMessage() {

    if (!saveMessage) {
        return;
    }


    saveMessage.textContent =
        "";

    saveMessage.style.display =
        "none";
}


/* ============================================================
   IMAGE RESIZE + JPEG CONVERSION
============================================================ */

async function resizeAndConvertToJPEG(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                (event) => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            const maxSize =
                                800;


                            let width =
                                image.width;

                            let height =
                                image.height;


                            if (
                                width > maxSize ||
                                height > maxSize
                            ) {

                                if (
                                    width > height
                                ) {

                                    height =
                                        Math.round(
                                            height *
                                            maxSize /
                                            width
                                        );

                                    width =
                                        maxSize;

                                } else {

                                    width =
                                        Math.round(
                                            width *
                                            maxSize /
                                            height
                                        );

                                    height =
                                        maxSize;
                                }
                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            canvas.toBlob(
                                (blob) => {

                                    if (!blob) {

                                        reject(
                                            new Error(
                                                "Could not process image."
                                            )
                                        );

                                        return;
                                    }


                                    const jpegFile =
                                        new File(
                                            [blob],
                                            "profile.jpg",
                                            {
                                                type:
                                                    "image/jpeg"
                                            }
                                        );


                                    resolve(
                                        jpegFile
                                    );

                                },
                                "image/jpeg",
                                0.85
                            );
                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Invalid image."
                                )
                            );
                        };


                    image.src =
                        event.target.result;
                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Could not read image."
                        )
                    );
                };


            reader.readAsDataURL(file);
        }
    );
}


/* ============================================================
   IMGBB UPLOAD
============================================================ */

async function uploadToImgBB(file) {

    if (
        !IMGBB_API_KEY ||
        IMGBB_API_KEY ===
        "YOUR_IMGBB_API_KEY"
    ) {

        throw new Error(
            "ImgBB API key is not configured."
        );
    }


    const formData =
        new FormData();


    formData.append(
        "key",
        IMGBB_API_KEY
    );


    formData.append(
        "image",
        file
    );


    const response =
        await fetch(
            "https://api.imgbb.com/1/upload",
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        throw new Error(
            "ImgBB upload request failed."
        );
    }


    const result =
        await response.json();


    if (
        !result.success ||
        !result.data ||
        !result.data.url
    ) {

        throw new Error(
            "ImgBB did not return an image URL."
        );
    }


    return result.data.url;
}
