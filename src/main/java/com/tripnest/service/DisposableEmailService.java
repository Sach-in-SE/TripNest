package com.tripnest.service;

import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class DisposableEmailService {

    // List of known disposable email domains
    // This list can be updated as needed without requiring code changes to the logic
    private static final Set<String> DISPOSABLE_DOMAINS = new HashSet<>();

    static {
        // Common disposable email domains
        DISPOSABLE_DOMAINS.add("tempmail.com");
        DISPOSABLE_DOMAINS.add("guerrillamail.com");
        DISPOSABLE_DOMAINS.add("mailinator.com");
        DISPOSABLE_DOMAINS.add("10minutemail.com");
        DISPOSABLE_DOMAINS.add("yopmail.com");
        DISPOSABLE_DOMAINS.add("throwawaymail.com");
        DISPOSABLE_DOMAINS.add("getairmail.com");
        DISPOSABLE_DOMAINS.add("sharklasers.com");
        DISPOSABLE_DOMAINS.add("temp-mail.org");
        DISPOSABLE_DOMAINS.add("maildrop.cc");
        DISPOSABLE_DOMAINS.add("fakeinbox.com");
        DISPOSABLE_DOMAINS.add("trashmail.com");
        DISPOSABLE_DOMAINS.add("tempmail.net");
        DISPOSABLE_DOMAINS.add("tempmail.de");
        DISPOSABLE_DOMAINS.add("mytemp.email");
        DISPOSABLE_DOMAINS.add("tempmail.co");
        DISPOSABLE_DOMAINS.add("tempmail adress.com");
        DISPOSABLE_DOMAINS.add("tempmail.net");
        DISPOSABLE_DOMAINS.add("tempmail.org");
        DISPOSABLE_DOMAINS.add("temp-mail.io");
        DISPOSABLE_DOMAINS.add("temp-mail.ru");
        DISPOSABLE_DOMAINS.add("tempmail.pp.ua");
        DISPOSABLE_DOMAINS.add("tempmail.ru");
        DISPOSABLE_DOMAINS.add("tempmail.us");
        DISPOSABLE_DOMAINS.add("tempmail2.com");
        DISPOSABLE_DOMAINS.add("tempmailer.com");
        DISPOSABLE_DOMAINS.add("tempmaildemo.com");
        DISPOSABLE_DOMAINS.add("tempmailo.com");
        DISPOSABLE_DOMAINS.add("tempmails.net");
        DISPOSABLE_DOMAINS.add("tempsky.com");
        DISPOSABLE_DOMAINS.add("tempthe.net");
        DISPOSABLE_DOMAINS.add("tempymail.com");
        DISPOSABLE_DOMAINS.add("tempzmail.com");
        DISPOSABLE_DOMAINS.add("test1.com");
        DISPOSABLE_DOMAINS.add("test2.com");
        DISPOSABLE_DOMAINS.add("test3.com");
        DISPOSABLE_DOMAINS.add("testemail.com");
        DISPOSABLE_DOMAINS.add("testemail.xxx");
        DISPOSABLE_DOMAINS.add("thanksnospam.info");
        DISPOSABLE_DOMAINS.add("thankyou2010.com");
        DISPOSABLE_DOMAINS.add("thc.theinfoserver.org");
        DISPOSABLE_DOMAINS.add("the-dmail.com");
        DISPOSABLE_DOMAINS.add("theairmail.com");
        DISPOSABLE_DOMAINS.add("theinternetemail.com");
        DISPOSABLE_DOMAINS.add("thelatestcam.com");
        DISPOSABLE_DOMAINS.add("themail.co");
        DISPOSABLE_DOMAINS.add("therenewableemail.com");
        DISPOSABLE_DOMAINS.add("theselfcompany.com");
        DISPOSABLE_DOMAINS.add("thetelephonechargers.com");
        DISPOSABLE_DOMAINS.add("thexef.com");
        DISPOSABLE_DOMAINS.add("thisisnotmyrealemail.com");
        DISPOSABLE_DOMAINS.add("thismail.net");
        DISPOSABLE_DOMAINS.add("thisurl.website");
        DISPOSABLE_DOMAINS.add("throw-away-email.com");
        DISPOSABLE_DOMAINS.add("throwawayemail.com");
        DISPOSABLE_DOMAINS.add("throwawaymail.com");
        DISPOSABLE_DOMAINS.add("ticktockmail.com");
        DISPOSABLE_DOMAINS.add("tilien.com");
        DISPOSABLE_DOMAINS.add("tittbit.org");
        DISPOSABLE_DOMAINS.add("tmail.ws");
        DISPOSABLE_DOMAINS.add("tmailinator.com");
        DISPOSABLE_DOMAINS.add("toiea.com");
        DISPOSABLE_DOMAINS.add("tokyomail.org");
        DISPOSABLE_DOMAINS.add("tonymoly.com");
        DISPOSABLE_DOMAINS.add("top-mail.co.uk");
        DISPOSABLE_DOMAINS.add("top1mail.net");
        DISPOSABLE_DOMAINS.add("topinmail.com");
        DISPOSABLE_DOMAINS.add("topramens.ml");
        DISPOSABLE_DOMAINS.add("tormail.org");
        DISPOSABLE_DOMAINS.add("tpwln.com");
        DISPOSABLE_DOMAINS.add("trbvm.com");
        DISPOSABLE_DOMAINS.add("trash-email.com");
        DISPOSABLE_DOMAINS.add("trash-mail.com");
        DISPOSABLE_DOMAINS.add("trash2009.com");
        DISPOSABLE_DOMAINS.add("trash2010.com");
        DISPOSABLE_DOMAINS.add("trash2011.com");
        DISPOSABLE_DOMAINS.add("trash4mail.com");
        DISPOSABLE_DOMAINS.add("trashbox.eu");
        DISPOSABLE_DOMAINS.add("trashemail.de");
        DISPOSABLE_DOMAINS.add("trashmail.com");
        DISPOSABLE_DOMAINS.add("trashmail.me");
        DISPOSABLE_DOMAINS.add("trashmail.net");
        DISPOSABLE_DOMAINS.add("trashmail.org");
        DISPOSABLE_DOMAINS.add("trashmail.ws");
        DISPOSABLE_DOMAINS.add("trashymail.com");
        DISPOSABLE_DOMAINS.add("trashymail.net");
        DISPOSABLE_DOMAINS.add("trashymail.org");
        DISPOSABLE_DOMAINS.add("trbvn.com");
        DISPOSABLE_DOMAINS.add("trillian.cc");
        DISPOSABLE_DOMAINS.add("trump-email.com");
        DISPOSABLE_DOMAINS.add("truuMail.com");
        DISPOSABLE_DOMAINS.add("tryzmail.com");
        DISPOSABLE_DOMAINS.add("tsoim.com");
        DISPOSABLE_DOMAINS.add("turoid.com");
        DISPOSABLE_DOMAINS.add("turual.com");
        DISPOSABLE_DOMAINS.add("twinmail.de");
        DISPOSABLE_DOMAINS.add("twnehh.com");
        DISPOSABLE_DOMAINS.add("txtads.net");
        DISPOSABLE_DOMAINS.add("typeracermail.com");
        DISPOSABLE_DOMAINS.add("uggsrock.com");
        DISPOSABLE_DOMAINS.add("uh.hu");
        DISPOSABLE_DOMAINS.add("ukr.net");
        DISPOSABLE_DOMAINS.add("ultra.fyx");
        DISPOSABLE_DOMAINS.add("unimark.com");
        DISPOSABLE_DOMAINS.add("unit25.org");
        DISPOSABLE_DOMAINS.add("unit7.net");
        DISPOSABLE_DOMAINS.add("unitmail.net");
        DISPOSABLE_DOMAINS.add("uroid.com");
        DISPOSABLE_DOMAINS.add("us.to");
        DISPOSABLE_DOMAINS.add("us.af");
        DISPOSABLE_DOMAINS.add("usa.cc");
        DISPOSABLE_DOMAINS.add("usabel.net");
        DISPOSABLE_DOMAINS.add("usbmail.com");
        DISPOSABLE_DOMAINS.add("users.skynetwork.be");
        DISPOSABLE_DOMAINS.add("usazip4.com");
        DISPOSABLE_DOMAINS.add("uscentric.com");
        DISPOSABLE_DOMAINS.add("usj.co");
        DISPOSABLE_DOMAINS.add("usmmail.com");
        DISPOSABLE_DOMAINS.add("usrlib.com");
        DISPOSABLE_DOMAINS.add("usrmail.org");
        DISPOSABLE_DOMAINS.add("ustin.net");
        DISPOSABLE_DOMAINS.add("utomb.com");
        DISPOSABLE_DOMAINS.add("uyhip.com");
        DISPOSABLE_DOMAINS.add("vaati.org");
        DISPOSABLE_DOMAINS.add("valemail.net");
        DISPOSABLE_DOMAINS.add("valhalladev.com");
        DISPOSABLE_DOMAINS.add("valleygmail.com");
        DISPOSABLE_DOMAINS.add("vctran.com");
        DISPOSABLE_DOMAINS.add("vegancheese.com");
        DISPOSABLE_DOMAINS.add("veerotech.net");
        DISPOSABLE_DOMAINS.add("venturingnet.com");
        DISPOSABLE_DOMAINS.add("verizon.net");
        DISPOSABLE_DOMAINS.add("veryseasonal.com");
        DISPOSABLE_DOMAINS.add("vfemail.net");
        DISPOSABLE_DOMAINS.add("victoriacoupons.com");
        DISPOSABLE_DOMAINS.add("vidchart.com");
        DISPOSABLE_DOMAINS.add("vikingsonly.com");
        DISPOSABLE_DOMAINS.add("vinernet.com");
        DISPOSABLE_DOMAINS.add("viraluploads.com");
        DISPOSABLE_DOMAINS.add("virt-email.com");
        DISPOSABLE_DOMAINS.add("virtual-mail.com");
        DISPOSABLE_DOMAINS.add("virtualemail.com");
        DISPOSABLE_DOMAINS.add("vixletdev.com");
        DISPOSABLE_DOMAINS.add("vmail.com");
        DISPOSABLE_DOMAINS.add("vmani.com");
        DISPOSABLE_DOMAINS.add("vmpanda.com");
        DISPOSABLE_DOMAINS.add("voicemee.com");
        DISPOSABLE_DOMAINS.add("vomoto.com");
        DISPOSABLE_DOMAINS.add("vpemail.com");
        DISPOSABLE_DOMAINS.add("vrmtr.com");
        DISPOSABLE_DOMAINS.add("vsimcard.com");
        DISPOSABLE_DOMAINS.add("vtxmail.com");
        DISPOSABLE_DOMAINS.add("vtsamples.com");
        DISPOSABLE_DOMAINS.add("vubemail.com");
        DISPOSABLE_DOMAINS.add("vx25.com");
        DISPOSABLE_DOMAINS.add("vx25.org");
        DISPOSABLE_DOMAINS.add("w3mail.com");
        DISPOSABLE_DOMAINS.add("wakeupfromyouramerican Dreams.com");
        DISPOSABLE_DOMAINS.add("walala.org");
        DISPOSABLE_DOMAINS.add("walkmail.net");
        DISPOSABLE_DOMAINS.add("walla.com");
        DISPOSABLE_DOMAINS.add("wastelandspam.net");
        DISPOSABLE_DOMAINS.add("watch-harry-potter.com");
        DISPOSABLE_DOMAINS.add("watchever.net");
        DISPOSABLE_DOMAINS.add("watchinghenry.com");
        DISPOSABLE_DOMAINS.add("waterford.net");
        DISPOSABLE_DOMAINS.add("wavefront.com");
        DISPOSABLE_DOMAINS.add("wbml.com");
        DISPOSABLE_DOMAINS.add("webemail.me");
        DISPOSABLE_DOMAINS.add("webemailonline.com");
        DISPOSABLE_DOMAINS.add("webhook.email");
        DISPOSABLE_DOMAINS.add("webmail24.com");
        DISPOSABLE_DOMAINS.add("webm4il.info");
        DISPOSABLE_DOMAINS.add("webmail23.com");
        DISPOSABLE_DOMAINS.add("webmail24l.com");
        DISPOSABLE_DOMAINS.add("webs.com");
        DISPOSABLE_DOMAINS.add("wecemail.com");
        DISPOSABLE_DOMAINS.add("wegmail.com");
        DISPOSABLE_DOMAINS.add("wegwerfmail.com");
        DISPOSABLE_DOMAINS.add("wegwerfmail.de");
        DISPOSABLE_DOMAINS.add("wegwerfmail.net");
        DISPOSABLE_DOMAINS.add("wegwerfmail.org");
        DISPOSABLE_DOMAINS.add("wfsu.edu");
        DISPOSABLE_DOMAINS.add("wh4f.org");
        DISPOSABLE_DOMAINS.add("whatiaas.com");
        DISPOSABLE_DOMAINS.add("whatpaas.com");
        DISPOSABLE_DOMAINS.add("whatsaas.com");
        DISPOSABLE_DOMAINS.add("whipmail.com");
        DISPOSABLE_DOMAINS.add("whyspam.me");
        DISPOSABLE_DOMAINS.add("wibblymail.com");
        DISPOSABLE_DOMAINS.add("wickmail.net");
        DISPOSABLE_DOMAINS.add("widgetw.com");
        DISPOSABLE_DOMAINS.add("wimsg.com");
        DISPOSABLE_DOMAINS.add("winemaven.info");
        DISPOSABLE_DOMAINS.add("winningtech.com");
        DISPOSABLE_DOMAINS.add("wmail.cf");
        DISPOSABLE_DOMAINS.add("wolfsmail.com");
        DISPOSABLE_DOMAINS.add("wollomail.com");
        DISPOSABLE_DOMAINS.add("wompwompmail.com");
        DISPOSABLE_DOMAINS.add("wood-carving.com");
        DISPOSABLE_DOMAINS.add("worldcoding.net");
        DISPOSABLE_DOMAINS.add("wowmail.com");
        DISPOSABLE_DOMAINS.add("wpg.ca");
        DISPOSABLE_DOMAINS.add("wrh.org");
        DISPOSABLE_DOMAINS.add("writeme.us");
        DISPOSABLE_DOMAINS.add("wronghead.com");
        DISPOSABLE_DOMAINS.add("wudupm.com");
        DISPOSABLE_DOMAINS.add("wuvhq.com");
        DISPOSABLE_DOMAINS.add("wuzup.net");
        DISPOSABLE_DOMAINS.add("wuzupmail.com");
        DISPOSABLE_DOMAINS.add("www.e4ward.com");
        DISPOSABLE_DOMAINS.add("www.gishpuppy.com");
        DISPOSABLE_DOMAINS.add("www.mailinator.com");
        DISPOSABLE_DOMAINS.add("wwwnew.email");
        DISPOSABLE_DOMAINS.add("wxnh.net");
        DISPOSABLE_DOMAINS.add("wyc.com");
        DISPOSABLE_DOMAINS.add("xagloo.co");
        DISPOSABLE_DOMAINS.add("xamail.com");
        DISPOSABLE_DOMAINS.add("xarchives.com");
        DISPOSABLE_DOMAINS.add("xemne.com");
        DISPOSABLE_DOMAINS.add("xent.com");
        DISPOSABLE_DOMAINS.add("xeps.com");
        DISPOSABLE_DOMAINS.add("xmail.com");
        DISPOSABLE_DOMAINS.add("xmaily.com");
        DISPOSABLE_DOMAINS.add("xn--9kq967o.com");
        DISPOSABLE_DOMAINS.add("xn--d-bga.net");
        DISPOSABLE_DOMAINS.add("xn--e-1g8a.com");
        DISPOSABLE_DOMAINS.add("xn--hxa.com");
        DISPOSABLE_DOMAINS.add("xn--mgbaam7a8h.com");
        DISPOSABLE_DOMAINS.add("xn--mgbaam7a8h.net");
        DISPOSABLE_DOMAINS.add("xn--p8j9a0b.com");
        DISPOSABLE_DOMAINS.add("xoxox.cc");
        DISPOSABLE_DOMAINS.add("x-permite.com");
        DISPOSABLE_DOMAINS.add("xrho.com");
        DISPOSABLE_DOMAINS.add("xsolla.com");
        DISPOSABLE_DOMAINS.add("xster.com");
        DISPOSABLE_DOMAINS.add("xvipmail.com");
        DISPOSABLE_DOMAINS.add("xwaretech.com");
        DISPOSABLE_DOMAINS.add("xwaretech.net");
        DISPOSABLE_DOMAINS.add("xwaretech.org");
        DISPOSABLE_DOMAINS.add("xy9e.com");
        DISPOSABLE_DOMAINS.add("yabna.com");
        DISPOSABLE_DOMAINS.add("yahmail.top");
        DISPOSABLE_DOMAINS.add("yamail.com");
        DISPOSABLE_DOMAINS.add("yanmail.com");
        DISPOSABLE_DOMAINS.add("yannmail.com");
        DISPOSABLE_DOMAINS.add("yapaa.com");
        DISPOSABLE_DOMAINS.add("yarnmaid.com");
        DISPOSABLE_DOMAINS.add("ycnri.com");
        DISPOSABLE_DOMAINS.add("yeah.net");
        DISPOSABLE_DOMAINS.add("ye.vc");
        DISPOSABLE_DOMAINS.add("yee.hk");
        DISPOSABLE_DOMAINS.add("yep.it");
        DISPOSABLE_DOMAINS.add("yertsd.com");
        DISPOSABLE_DOMAINS.add("yhg.biz");
        DISPOSABLE_DOMAINS.add("yincp.com");
        DISPOSABLE_DOMAINS.add("yopmail.com");
        DISPOSABLE_DOMAINS.add("yopmail.fr");
        DISPOSABLE_DOMAINS.add("yopmail.net");
        DISPOSABLE_DOMAINS.add("yourdomain.com");
        DISPOSABLE_DOMAINS.add("youremail.com");
        DISPOSABLE_DOMAINS.add("youriails.com");
        DISPOSABLE_DOMAINS.add("yourl.com");
        DISPOSABLE_DOMAINS.add("yourspamgoesto.com");
        DISPOSABLE_DOMAINS.add("yourtube.net");
        DISPOSABLE_DOMAINS.add("ypmail.webmast.com");
        DISPOSABLE_DOMAINS.add("yspend.com");
        DISPOSABLE_DOMAINS.add("ytubem.com");
        DISPOSABLE_DOMAINS.add("yupmail.com");
        DISPOSABLE_DOMAINS.add("yuoia.com");
        DISPOSABLE_DOMAINS.add("yuurok.com");
        DISPOSABLE_DOMAINS.add("yvvb.com");
        DISPOSABLE_DOMAINS.add("yxzx.net");
        DISPOSABLE_DOMAINS.add("yyhmail.com");
        DISPOSABLE_DOMAINS.add("yyvmail.com");
        DISPOSABLE_DOMAINS.add("zagmail.com");
        DISPOSABLE_DOMAINS.add("zai.to");
        DISPOSABLE_DOMAINS.add("zaks.com");
        DISPOSABLE_DOMAINS.add("zasod.com");
        DISPOSABLE_DOMAINS.add("zbaba.com");
        DISPOSABLE_DOMAINS.add("zbera.com");
        DISPOSABLE_DOMAINS.add("zehnminutenmail.de");
        DISPOSABLE_DOMAINS.add("zenithprefer.com");
        DISPOSABLE_DOMAINS.add("zenmailpredator.com");
        DISPOSABLE_DOMAINS.add("zehp.com");
        DISPOSABLE_DOMAINS.add("zexact.com");
        DISPOSABLE_DOMAINS.add("zfree.com");
        DISPOSABLE_DOMAINS.add("zgi.org");
        DISPOSABLE_DOMAINS.add("zicp.com");
        DISPOSABLE_DOMAINS.add("zik.cu");
        DISPOSABLE_DOMAINS.add("zimail.com");
        DISPOSABLE_DOMAINS.add("zindocz.com");
        DISPOSABLE_DOMAINS.add("zippymail.com");
        DISPOSABLE_DOMAINS.add("zipsendtest.com");
        DISPOSABLE_DOMAINS.add("zirby.com");
        DISPOSABLE_DOMAINS.add("zisk.me");
        DISPOSABLE_DOMAINS.add("zloader.net");
        DISPOSABLE_DOMAINS.add("zmail.com");
        DISPOSABLE_DOMAINS.add("zmoile.com");
        DISPOSABLE_DOMAINS.add("zoaxe.com");
        DISPOSABLE_DOMAINS.add("zoemail.com");
        DISPOSABLE_DOMAINS.add("zoetropes.org");
        DISPOSABLE_DOMAINS.add("zomg.info");
        DISPOSABLE_DOMAINS.add("zoneby.com");
        DISPOSABLE_DOMAINS.add("zootera.com");
        DISPOSABLE_DOMAINS.add("zq.com");
        DISPOSABLE_DOMAINS.add("zumpul.com");
        DISPOSABLE_DOMAINS.add("zusmail.com");
        DISPOSABLE_DOMAINS.add("zvmail.com");
        DISPOSABLE_DOMAINS.add("zwial.com");
        DISPOSABLE_DOMAINS.add("zxcv.com");
        DISPOSABLE_DOMAINS.add("zxcvbnm.com");
        DISPOSABLE_DOMAINS.add("zymail.com");
        DISPOSABLE_DOMAINS.add("zyp.net");
        DISPOSABLE_DOMAINS.add("zypmail.com");
        DISPOSABLE_DOMAINS.add("zysmail.com");
        DISPOSABLE_DOMAINS.add("zzz.com");
    }

    /**
     * Check if an email domain is a disposable email domain
     * @param email The email address to check
     * @return true if the domain is disposable, false otherwise
     */
    public boolean isDisposableEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }

        try {
            String domain = extractDomain(email);
            return DISPOSABLE_DOMAINS.contains(domain.toLowerCase());
        } catch (Exception e) {
            // If email format is invalid, don't block it
            return false;
        }
    }

    /**
     * Extract the domain from an email address
     * @param email The email address
     * @return The domain part of the email
     */
    private String extractDomain(String email) {
        int atIndex = email.lastIndexOf('@');
        if (atIndex > 0 && atIndex < email.length() - 1) {
            return email.substring(atIndex + 1);
        }
        throw new IllegalArgumentException("Invalid email format");
    }

    /**
     * Add a new disposable domain to the list (for maintenance purposes)
     * @param domain The domain to add
     */
    public void addDisposableDomain(String domain) {
        DISPOSABLE_DOMAINS.add(domain.toLowerCase());
    }

    /**
     * Remove a domain from the disposable list (for maintenance purposes)
     * @param domain The domain to remove
     */
    public void removeDisposableDomain(String domain) {
        DISPOSABLE_DOMAINS.remove(domain.toLowerCase());
    }

    /**
     * Get the current list of disposable domains
     * @return Set of disposable domains
     */
    public Set<String> getDisposableDomains() {
        return new HashSet<>(DISPOSABLE_DOMAINS);
    }
}