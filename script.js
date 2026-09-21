import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ===============================
// VARIABEL
// ===============================

let html5QrCode;
let npmMahasiswa = "";
let namaMahasiswa = "";


// ===============================
// TOMBOL BUAT QR
// ===============================

document
    .getElementById("btnBuatQR")
    .addEventListener("click", buatQR);


// ===============================
// BUAT QR
// ===============================

async function buatQR() {

    const nim =
        document.getElementById("nim").value.trim();

    const pesan =
        document.getElementById("pesan");


    // Cek NPM
    if (nim === "") {

        pesan.style.color = "#dc2626";

        pesan.textContent =
            "Silakan masukkan NPM terlebih dahulu.";

        return;
    }


    pesan.style.color = "#2563eb";

    pesan.textContent =
        "Memeriksa NPM...";


    try {

        // ===============================
        // CEK MAHASISWA
        // ===============================

        const mahasiswaRef =
            doc(db, "mahasiswa", nim);

        const mahasiswaSnap =
            await getDoc(mahasiswaRef);


        if (!mahasiswaSnap.exists()) {

            pesan.style.color = "#dc2626";

            pesan.textContent =
                "NPM belum terdaftar di Firebase.";

            return;
        }


        // Simpan data mahasiswa
        const dataMahasiswa =
            mahasiswaSnap.data();

        npmMahasiswa = nim;

        namaMahasiswa =
            dataMahasiswa.nama || "Mahasiswa";


        // ===============================
        // CARI SESI AKTIF
        // ===============================

        const sesiQuery =
            query(
                collection(db, "sesi"),
                where("aktif", "==", true)
            );

        const sesiSnapshot =
            await getDocs(sesiQuery);


        if (sesiSnapshot.empty) {

            pesan.style.color = "#dc2626";

            pesan.textContent =
                "Belum ada sesi absensi yang aktif.";

            return;
        }


        // Ambil sesi terbaru
        const sesiDoc =
            sesiSnapshot.docs[
                sesiSnapshot.docs.length - 1
            ];

        const dataSesi =
            sesiDoc.data();


        const kodeSesi =
            dataSesi.kodeSesi;


        // ===============================
        // BUAT DATA QR
        // ===============================

        const dataQR =
            JSON.stringify({
                kodeSesi: kodeSesi,
                npm: npmMahasiswa
            });


        // Bersihkan QR sebelumnya
        document.getElementById("qrcode").innerHTML =
            "";


        // Buat QR
        new QRCode(
            document.getElementById("qrcode"),
            {
                text: dataQR,
                width: 250,
                height: 250
            }
        );


        // Tampilkan QR
        document.getElementById("bagianQR")
            .style.display = "block";


        pesan.style.color = "#16a34a";

        pesan.textContent =
            "QR berhasil dibuat. Silakan scan QR tersebut.";


    } catch (error) {

        console.error(
            "Gagal membuat QR:",
            error
        );

        pesan.style.color = "#dc2626";

        pesan.textContent =
            "Terjadi kesalahan saat membuat QR.";
    }

}


// ===============================
// MULAI SCAN
// ===============================

function mulaiScan() {

    const pesan =
        document.getElementById("pesan");


    document.getElementById("scanner")
        .style.display = "block";


    pesan.style.color = "#2563eb";

    pesan.textContent =
        "Arahkan kamera ke QR Absensi...";


    html5QrCode =
        new Html5Qrcode("scanner");


    html5QrCode.start(

        {
            facingMode: "environment"
        },

        {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            }
        },

        function(qrCodeMessage) {

            prosesScan(qrCodeMessage);

        },

        function(errorMessage) {

            // Abaikan error scan sementara

        }

    ).catch(function(error) {

        console.error(error);

        pesan.style.color = "#dc2626";

        pesan.textContent =
            "Kamera tidak dapat dibuka. Izinkan akses kamera.";

    });

}


// ===============================
// PROSES QR
// ===============================

async function prosesScan(qrCodeMessage) {

    try {

        // Hentikan scanner
        if (html5QrCode) {

            try {

                await html5QrCode.stop();

            } catch (error) {

                console.log(
                    "Scanner sudah berhenti."
                );

            }

        }


        // ===============================
        // BACA DATA QR
        // ===============================

        const dataQR =
            JSON.parse(qrCodeMessage);


        const kodeSesi =
            dataQR.kodeSesi;

        const npm =
            dataQR.npm;


        if (!kodeSesi || !npm) {

            alert(
                "QR tidak valid."
            );

            return;
        }


        // ===============================
        // CEK SESI
        // ===============================

        const sesiQuery =
            query(
                collection(db, "sesi"),
                where(
                    "kodeSesi",
                    "==",
                    kodeSesi
                )
            );


        const sesiSnapshot =
            await getDocs(sesiQuery);


        if (sesiSnapshot.empty) {

            alert(
                "Sesi absensi tidak ditemukan."
            );

            return;
        }


        const dataSesi =
            sesiSnapshot.docs[0].data();


        // ===============================
        // CEK MAHASISWA
        // ===============================

        const mahasiswaRef =
            doc(
                db,
                "mahasiswa",
                npm
            );


        const mahasiswaSnap =
            await getDoc(
                mahasiswaRef
            );


        if (!mahasiswaSnap.exists()) {

            alert(
                "NPM belum terdaftar."
            );

            return;
        }


        const dataMahasiswa =
            mahasiswaSnap.data();


        const nama =
            dataMahasiswa.nama ||
            "Mahasiswa";


        // ===============================
        // WAKTU
        // ===============================

        const sekarang =
            new Date();


        const tanggal =
            sekarang.toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );


        const waktu =
            sekarang.toLocaleTimeString(
                "id-ID",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );


        // ===============================
        // ID ABSENSI
        // ===============================

        const idAbsensi =
            npm + "_" + kodeSesi;


        // ===============================
        // SIMPAN ABSENSI
        // ===============================

        try {

            await setDoc(

                doc(
                    db,
                    "absensi",
                    idAbsensi
                ),

                {

                    nim: npm,

                    nama: nama,

                    mataKuliah:
                        dataSesi.mataKuliah,

                    pertemuan:
                        dataSesi.pertemuan,

                    kodeQR:
                        kodeSesi,

                    tanggal:
                        tanggal,

                    waktu:
                        waktu,

                    status:
                        "HADIR",

                    createdAt:
                        serverTimestamp()

                },

                {
                    merge: false
                }

            );

        } catch (error) {

            console.error(
                "Gagal menyimpan:",
                error
            );


            if (
                error.code ===
                "permission-denied"
            ) {

                alert(
                    "NPM ini sudah melakukan absensi untuk sesi tersebut."
                );

            } else {

                alert(
                    "Gagal menyimpan absensi ke Firebase."
                );

            }

            return;
        }


        // ===============================
        // TAMPILKAN HASIL
        // ===============================

        document.getElementById(
            "hasilNim"
        ).textContent =
            npm;


        document.getElementById(
            "hasilNama"
        ).textContent =
            nama;


        document.getElementById(
            "hasilMatkul"
        ).textContent =
            dataSesi.mataKuliah;


        document.getElementById(
            "hasilPertemuan"
        ).textContent =
            dataSesi.pertemuan;


        document.getElementById(
            "hasilTanggal"
        ).textContent =
            tanggal;


        document.getElementById(
            "hasilWaktu"
        ).textContent =
            waktu;


        document.getElementById(
            "halamanAwal"
        ).style.display =
            "none";


        document.getElementById(
            "halamanBerhasil"
        ).style.display =
            "flex";


    } catch (error) {

        console.error(
            "QR tidak dapat diproses:",
            error
        );

        alert(
            "QR tidak valid atau terjadi kesalahan."
        );

    }

}


// ===============================
// TOMBOL SCAN
// ===============================

const tombolScan =
    document.createElement("button");

tombolScan.textContent =
    "📷 Scan QR";

tombolScan.style.marginTop =
    "15px";

tombolScan.addEventListener(
    "click",
    mulaiScan
);


document
    .getElementById("bagianQR")
    .appendChild(tombolScan);