<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260102210500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE question (id INT AUTO_INCREMENT NOT NULL, test_id INT DEFAULT NULL, content VARCHAR(255) NOT NULL, INDEX IDX_B6F7494E1E5D0459 (test_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE test (id INT AUTO_INCREMENT NOT NULL, subject_id INT DEFAULT NULL, student_id INT DEFAULT NULL, score DOUBLE PRECISION DEFAULT NULL, INDEX IDX_D87F7E0C23EDC87 (subject_id), INDEX IDX_D87F7E0CCB944F1A (student_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE question ADD CONSTRAINT FK_B6F7494E1E5D0459 FOREIGN KEY (test_id) REFERENCES test (id)');
        $this->addSql('ALTER TABLE test ADD CONSTRAINT FK_D87F7E0C23EDC87 FOREIGN KEY (subject_id) REFERENCES subject (id)');
        $this->addSql('ALTER TABLE test ADD CONSTRAINT FK_D87F7E0CCB944F1A FOREIGN KEY (student_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE question DROP FOREIGN KEY FK_B6F7494E1E5D0459');
        $this->addSql('ALTER TABLE test DROP FOREIGN KEY FK_D87F7E0C23EDC87');
        $this->addSql('ALTER TABLE test DROP FOREIGN KEY FK_D87F7E0CCB944F1A');
        $this->addSql('DROP TABLE question');
        $this->addSql('DROP TABLE test');
    }
}
